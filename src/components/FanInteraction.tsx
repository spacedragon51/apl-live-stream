import { motion } from "motion/react";
import { Poll } from "../types";
import { Users, Heart, Share2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export default function FanInteraction({ poll, matchId, onReaction }: { poll?: Poll, matchId?: string, onReaction?: (emoji: string) => void }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (index: number) => {
    if (!poll || !auth.currentUser || selectedOption !== null || !matchId) return;
    
    setIsVoting(true);
    const path = `matches/${matchId}/polls/${poll.id}/votes`;
    try {
      await addDoc(collection(db, path), {
        pollId: poll.id,
        userId: auth.currentUser.uid,
        optionIndex: index,
        timestamp: serverTimestamp()
      });
      setSelectedOption(index);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji);
    }
    // Also try to persist to firestore if needed, but socket is primary for "web working on click"
    if (matchId && auth.currentUser) {
      const path = `matches/${matchId}/reactions`;
      addDoc(collection(db, path), {
        matchId,
        emoji,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">
          <Users className="w-4 h-4" />
          Fan Poll
        </div>

        {poll ? (
          <div className="space-y-4">
            <h4 className="text-lg font-bold tracking-tight">{poll.question}</h4>
            <div className="space-y-3">
              {poll.options.map((option, i) => (
                <button
                  key={i}
                  disabled={selectedOption !== null || isVoting}
                  onClick={() => handleVote(i)}
                  className="w-full relative overflow-hidden group"
                >
                  <div className={cn(
                    "relative z-10 w-full px-5 py-4 rounded-2xl border transition-all flex items-center justify-between",
                    selectedOption === i 
                      ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-white/5 border-white/5 hover:border-white/20 text-white/70"
                  )}>
                    <span className="font-medium">{option}</span>
                    {selectedOption !== null && (
                      <span className="text-sm font-mono font-bold bg-black/10 px-2 py-0.5 rounded-md">
                        {poll.results ? poll.results[i] : (selectedOption === i ? "100%" : "0%")}
                      </span>
                    )}
                  </div>
                  {selectedOption !== null && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${poll.results ? poll.results[i] : (selectedOption === i ? 100 : 0)}%` }}
                      className="absolute inset-y-0 left-0 bg-white/10 pointer-events-none"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-mono text-white/20 text-center uppercase tracking-widest mt-4">
              {selectedOption !== null ? "Thanks for voting!" : "Vote to see results"}
            </p>
          </div>
        ) : (
          <div className="py-12 text-center text-white/20 italic text-sm">
            Waiting for next poll...
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">Fan Reactions</h3>
        <div className="flex justify-between gap-2">
          {[
            { emoji: "🏏", color: "from-orange-500/20 to-orange-500/10" },
            { emoji: "6️⃣", color: "from-yellow-500/20 to-yellow-500/10" },
            { emoji: "☝️", color: "from-blue-500/20 to-blue-500/10" },
            { emoji: "🔥", color: "from-red-500/20 to-red-500/10" },
            { emoji: "👏", color: "from-emerald-500/20 to-emerald-500/10" }
          ].map((react) => (
            <motion.button
              key={react.emoji}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(react.emoji)}
              className={cn(
                "p-4 rounded-2xl border border-white/5 bg-gradient-to-br flex items-center justify-center text-2xl transition-all",
                react.color
              )}
            >
              {react.emoji}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
