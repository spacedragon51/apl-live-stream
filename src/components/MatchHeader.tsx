import { Match } from "../types";
import { Trophy, Timer, Share2 } from "lucide-react";

export default function MatchHeader({ match }: { match: Match }) {
  return (
    <div className="bg-gradient-to-br from-indigo-950 via-zinc-900 to-black border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Home Team */}
        <div className="flex-1 text-center md:text-right">
          <div className="inline-block p-4 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-2">{match.homeTeam}</h2>
          <span className="text-xs font-mono text-white/30 tracking-[0.2em]">BATTING</span>
        </div>

        {/* Scoreboard */}
        <div className="flex flex-col items-center gap-4 py-6 px-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-bold text-white uppercase tracking-tighter animate-pulse mb-2">LIVE</div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black tracking-tighter tabular-nums text-white">
                {match.score}/{match.wickets}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-2 bg-white/10 rounded-full border border-white/10">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="text-lg font-mono font-bold tracking-widest">{match.overs}.{match.ballsInOver || 0} Overs</span>
          </div>
          
          <div className="flex justify-center gap-1">
            {(match.lastBalls || []).map((ball, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                ball === 'W' ? 'bg-red-500 border-red-400' : 
                ball === '6' ? 'bg-indigo-600 border-indigo-400' :
                ball === '4' ? 'bg-emerald-600 border-emerald-400' :
                'bg-white/10 border-white/10'
              }`}>
                {ball}
              </div>
            ))}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Trophy className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-2">{match.awayTeam}</h2>
          <span className="text-xs font-mono text-white/30 tracking-[0.2em]">BOWLING</span>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
        <div className="flex flex-col items-center">
            <span>CRR</span>
            <span className="text-white text-lg font-bold">{match.crr}</span>
        </div>
        {match.rrr && (
          <div className="flex flex-col items-center">
              <span>RRR</span>
              <span className="text-white text-lg font-bold">{match.rrr}</span>
          </div>
        )}
        <div className="flex flex-col items-center">
            <span>Partnership</span>
            <span className="text-white text-lg font-bold">{match.partnership}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-white/20 uppercase">Striker</span>
                  <span className="text-sm font-bold text-white/90">{match.striker}</span>
              </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-white/20 uppercase">Bowler</span>
                  <span className="text-sm font-bold text-white/90">{match.bowler}</span>
              </div>
          </div>
      </div>

      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
