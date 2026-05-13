import { Match } from "../types";
import { BarChart2 } from "lucide-react";

export default function MatchStats({ match }: { match?: Match }) {
  if (!match) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6 flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        Win Probability
      </h3>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="relative h-6 w-full bg-white/5 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-yellow-500 transition-all duration-1000 flex items-center justify-center" 
            style={{ width: `65%` }} 
          >
             <span className="text-[10px] font-black text-black">65%</span>
          </div>
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 flex items-center justify-center" 
            style={{ width: `35%` }} 
          >
             <span className="text-[10px] font-black text-white">35%</span>
          </div>
          <div className="absolute inset-0 flex justify-between px-4 items-center pointer-events-none">
             <span className="text-[10px] font-bold uppercase">{match.batting}</span>
             <span className="text-[10px] font-bold uppercase">{match.bowling}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                    <span>Current Run Rate</span>
                    <span className="text-white font-bold">{match.crr}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(match.crr / 15) * 100}%` }} />
                </div>
            </div>
            {match.rrr && (
              <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                      <span>Required Run Rate</span>
                      <span className="text-white font-bold">{match.rrr}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(match.rrr / 15) * 100}%` }} />
                  </div>
              </div>
            )}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                    <span>Partnership</span>
                    <span className="text-emerald-400 font-bold">{match.partnership} Runs</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-[40%] opacity-20" />
                </div>
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono text-white/20 uppercase block mb-1">Dot Ball %</span>
          <span className="text-2xl font-black tabular-nums">24%</span>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono text-white/20 uppercase block mb-1">Boundary Rate</span>
          <span className="text-2xl font-black tabular-nums">1.4 <span className="text-sm font-normal text-white/40">/over</span></span>
        </div>
      </div>
    </div>
  );
}
