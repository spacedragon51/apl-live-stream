export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  batting: string;
  bowling: string;
  score: number;
  wickets: number;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'DELAYED';
  overs: number;
  ballsInOver: number;
  crr: number;
  rrr?: number;
  target?: number;
  lastBalls: string[];
  partnership: number;
  striker: string;
  bowler: string;
}

export interface MatchEvent {
  type: string;
  text: string;
  timestamp: number;
}

export interface Poll {
  id: string;
  matchId: string;
  question: string;
  options: string[];
  active: boolean;
  results?: number[];
}

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
}

export interface Insight {
  id: string;
  text: string;
  type: 'TACTICAL' | 'PREDICTION' | 'MOMENT';
  timestamp: number;
}
