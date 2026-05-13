import { motion, AnimatePresence } from "motion/react";
import { Insight } from "../types";
import { Brain, Sparkles, AlertCircle } from "lucide-react";

export default function AIInsights({ insights }: { insights: Insight[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Tactical Feed
        </h3>
        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
      </div>

      <div className="flex-1 space-y-4">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group"
            >
              <div className={i === 0 ? "absolute top-0 left-0 w-1 h-full bg-emerald-500" : ""} />
              <div className="flex gap-3">
                <div className="mt-1">
                  <AlertCircle className={i === 0 ? "w-4 h-4 text-emerald-400" : "w-4 h-4 text-white/20"} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-relaxed text-white/90">
                    {insight.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">{insight.type}</span>
                    <span className="text-[10px] font-mono text-white/10 italic">just now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="px-4 py-2 bg-emerald-500/10 rounded-xl flex items-center justify-between">
           <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Model</span>
           <span className="text-[10px] font-mono text-emerald-400/60 uppercase">Gemini 3 Flash</span>
        </div>
      </div>
    </div>
  );
}
