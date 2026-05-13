import { motion, AnimatePresence } from "motion/react";
import { Trophy, Activity, MessageSquare, Zap, TrendingUp, Users, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Match, Poll, Insight, MatchEvent } from "./types";
import { cn } from "./lib/utils";
import MatchHeader from "./components/MatchHeader";
import AIInsights from "./components/AIInsights";
import FanInteraction from "./components/FanInteraction";
import MatchStats from "./components/MatchStats";
import { auth } from "./lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { io, Socket } from "socket.io-client";

export default function App() {
  const [match, setMatch] = useState<Match | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth).catch(console.error);
    });

    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to Real-time Stream");
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("matchUpdate", (data: Match) => {
      setMatch(data);
    });

    socket.on("activePoll", (poll: Poll) => {
      setActivePoll(poll);
    });

    socket.on("matchEvent", (event: { type: string, text: string }) => {
      setEvents(prev => [{ ...event, timestamp: Date.now() }, ...prev.slice(0, 19)]);
    });

    socket.on("aiInsight", (insight: Insight) => {
      setInsights(prev => [insight, ...prev.slice(0, 4)]);
    });

    socket.on("newReaction", (reaction: { emoji: string, timestamp: number }) => {
      // In a real app we might update a global reaction count or show a floating emoji
    });

    // Initial insights fallback while waiting for first socket event
    setInsights([
      { id: '1', text: "Analyzing the match situation for live tactical insights...", type: 'TACTICAL', timestamp: Date.now() }
    ]);

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendReaction = (emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit("sendReaction", emoji);
    }
  };

  const submitPrediction = (outcome: string) => {
    if (socketRef.current) {
      socketRef.current.emit("submitPrediction", { outcome, timestamp: Date.now() });
      // Visual feedback
      alert(`Prediction submitted: ${outcome}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-yellow-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-1.5 rounded-lg shadow-lg shadow-yellow-500/20">
            <Zap className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter italic uppercase">IPL LIVE PULSE</h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-white/50 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-600 animate-pulse")} />
            {isConnected ? "LIVE FEED: CONNECTED" : "RECONNECTING..."}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            4.2M FANS
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {match ? <MatchHeader match={match} /> : (
            <div className="h-[400px] bg-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center border border-white/10">
                <span className="text-white/20 font-black uppercase tracking-widest">Connecting to Live Feed...</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MatchStats match={match || undefined} />
            <AIInsights insights={insights} />
          </div>

          {/* Timeline Feed */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <TrendingUp className="w-32 h-32" />
             </div>
             <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Ball-by-Ball Feed
             </h3>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {events.length > 0 ? events.map((event) => (
                    <motion.div
                      key={event.timestamp}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                        event.type === 'W' ? "bg-red-500" :
                        event.type === '6' ? "bg-indigo-600" :
                        event.type === '4' ? "bg-emerald-600" :
                        "bg-white/10"
                      )}>
                        {event.type}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/90">{event.text}</p>
                        <span className="text-[10px] font-mono text-white/20">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-12 text-white/20 font-mono italic">Waiting for live action...</div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <FanInteraction poll={activePoll || undefined} matchId={match?.id} onReaction={sendReaction} />

          
          {/* Real-time Prediction Widget */}
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-8 h-8 text-yellow-400 opacity-20" />
            </div>
            <h3 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Moment Challenge
            </h3>
            <p className="text-lg font-bold mb-6">Outcome of next ball?</p>
            <div className="grid grid-cols-2 gap-3">
               {["Dot Ball", "Single", "Boundary", "Wicket"].map((opt) => (
                 <button 
                  key={opt} 
                  onClick={() => submitPrediction(opt)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm active:scale-95"
                 >
                   {opt}
                 </button>
               ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-white/40">
               <span>+50 Points for correct prediction</span>
               <span className="text-yellow-400 font-bold">LIVE NOW</span>
            </div>
          </div>


          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Leaderboard
            </h3>
            <div className="space-y-4">
              {[
                { name: "IPL_Master", points: 2450, rank: 1 },
                { name: "CSK_Fan_No1", points: 2120, rank: 2 },
                { name: "Rohit_Hitman", points: 1980, rank: 3 }
              ].map((user) => (
                <div key={user.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black text-xs">
                    {user.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[10px] text-white/40">{user.points} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
