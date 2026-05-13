import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket', 'polling']
  });

  const PORT = 3000;

  interface CricketState {
    id: string;
    homeTeam: string;
    awayTeam: string;
    batting: string;
    bowling: string;
    score: number;
    wickets: number;
    overs: number;
    ballsInOver: number;
    crr: number;
    rrr?: number;
    target?: number;
    lastBalls: string[];
    striker: string;
    bowler: string;
    partnership: number;
    status: 'LIVE' | 'FINISHED' | 'UPCOMING' | 'DELAYED';
  }

  let matchState: CricketState = {
    id: "ipl-2026-rcb-kkr",
    homeTeam: "Royal Challengers Bengaluru",
    awayTeam: "Kolkata Knight Riders",
    batting: "Royal Challengers Bengaluru",
    bowling: "Kolkata Knight Riders",
    score: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    crr: 0,
    lastBalls: [],
    striker: "Virat Kohli",
    bowler: "Mitchell Starc",
    partnership: 0,
    status: "DELAYED"
  };

  let currentPoll: any = null;

  const teamSquads: Record<string, string[]> = {
    "Chennai Super Kings": ["Ruturaj Gaikwad", "Daryl Mitchell", "Shivam Dube", "Ravindra Jadeja", "MS Dhoni", "Matheesha Pathirana", "Tushar Deshpande"],
    "Mumbai Indians": ["Hardik Pandya", "Rohit Sharma", "Suryakumar Yadav", "Ishan Kishan", "Jasprit Bumrah", "Gerald Coetzee", "Tim David"],
    "Kolkata Knight Riders": ["Shreyas Iyer", "Sunil Narine", "Andre Russell", "Rinku Singh", "Venkatesh Iyer", "Mitchell Starc", "Varun Chakaravarthy"],
    "Lucknow Super Giants": ["KL Rahul", "Quinton de Kock", "Nicholas Pooran", "Marcus Stoinis", "Ayush Badoni", "Ravi Bishnoi", "Naveen-ul-Haq"],
    "Royal Challengers Bengaluru": ["Virat Kohli", "Faf du Plessis", "Glenn Maxwell", "Rajat Patidar", "Mohammed Siraj", "Yash Dayal", "Cameron Green"],
    "Gujarat Titans": ["Shubman Gill", "Rashid Khan", "David Miller", "Sai Sudharsan", "Mohit Sharma", "Sandip Warrier", "Rahul Tewatia"],
    "Rajasthan Royals": ["Sanju Samson", "Yashasvi Jaiswal", "Jos Buttler", "Riyan Parag", "Shimron Hetmyer", "Yuzvendra Chahal", "Trent Boult"]
  };

  function getPlayersForTeam(team: string) {
    return teamSquads[team] || ["Player A", "Player B", "Player C", "Player D", "Player E", "Player F", "Player G"];
  }

  // Initialize match with AI to find "today's" match
  async function initializeMatch() {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `It is May 13th, 2026, 8:15 PM IST (Indian Standard Time). 
      This is a LIVE IPL match between Royal Challengers Bengaluru (RCB) and Kolkata Knight Riders (KKR).
      Check for any simulation/hypothetical "real-time" information: If there's a rain delay or toss delay, specify { "status": "DELAYED" }.
      Otherwise, generate a realistic score if the match had started at 7:30 PM IST.
      The user says: "the match is delayed and both the teams are yet to bat currently". Honor this feedback.
      Return ONLY a JSON object: { "homeTeam": "Royal Challengers Bengaluru", "awayTeam": "Kolkata Knight Riders", "batting": string, "bowling": string, "score": number, "wickets": number, "overs": number, "ballsInOver": number, "striker": string, "bowler": string, "partnership": number, "target": number (optional), "status": "LIVE" | "DELAYED" | "UPCOMING", "id": string }`;
      
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 12000))
      ]);

      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        matchState = { 
          ...matchState, 
          ...data,
          lastBalls: data.status === "LIVE" ? ["1", "4", "0", "2", "6", "1"] : []
        };
        console.log("🔥 Match initialized via AI for May 13, 2026 (RCB vs KKR): Status ", matchState.status);
        io.emit("matchUpdate", matchState);
        
        const statusText = matchState.status === "DELAYED" ? "MATCH DELAYED DUE TO RAIN" : "LIVE FROM CHINNASWAMY";
        io.emit("matchEvent", { type: "system", text: `${statusText}: Royal Challengers Bengaluru vs Kolkata Knight Riders!` });
      }
    } catch (error) {
      console.error("AI Init failed or timed out, using defaults:", error);
      io.emit("matchUpdate", matchState);
    }
  }

  initializeMatch();

  const possibleBalls = [
    { res: "0", weight: 30 },
    { res: "1", weight: 35 },
    { res: "2", weight: 10 },
    { res: "4", weight: 12 },
    { res: "6", weight: 8 },
    { res: "W", weight: 5 }
  ];
  
  function getWeightedBall() {
    const total = possibleBalls.reduce((acc, curr) => acc + curr.weight, 0);
    let random = Math.random() * total;
    for (const ball of possibleBalls) {
      if (random < ball.weight) return ball.res;
      random -= ball.weight;
    }
    return "0";
  }

  function simulateBall() {
    if (matchState.status !== "LIVE") return;

    const result = getWeightedBall();
    
    matchState.lastBalls.push(result);
    if (matchState.lastBalls.length > 6) matchState.lastBalls.shift();

    if (result === "W") {
      matchState.wickets++;
      matchState.partnership = 0;
      // Change striker on wicket
      const battingSquad = getPlayersForTeam(matchState.batting);
      matchState.striker = battingSquad[Math.floor(Math.random() * battingSquad.length)];
    } else {
      const runs = parseInt(result);
      matchState.score += runs;
      matchState.partnership += runs;
    }

    matchState.ballsInOver++;
    if (matchState.ballsInOver === 6) {
      matchState.overs++;
      matchState.ballsInOver = 0;
      // Change bowler on new over
      const bowlingSquad = getPlayersForTeam(matchState.bowling);
      matchState.bowler = bowlingSquad[Math.floor(Math.random() * bowlingSquad.length)];
    }

    const totalOversAsFloat = matchState.overs + (matchState.ballsInOver / 6);
    matchState.crr = totalOversAsFloat > 0 ? parseFloat((matchState.score / totalOversAsFloat).toFixed(2)) : 0;

    // Check for target completion if chasing
    if (matchState.target && matchState.score >= matchState.target) {
        matchState.status = "FINISHED";
        io.emit("matchEvent", { type: "system", text: `MATCH FINISHED! ${matchState.batting} WON THE MATCH!` });
    }

    io.emit("matchUpdate", matchState);
    io.emit("matchEvent", { type: result, text: getBallText(result, matchState) });
  }

  function getBallText(result: string, state: CricketState) {
    if (result === "W") return `WICKET! ${state.striker} is OUT! A massive moment in the match!`;
    if (result === "6") return `SIX! Out of the park! ${state.striker} is putting on a show!`;
    if (result === "4") return `FOUR! Beautifully timed by ${state.striker}.`;
    return `${result} run(s). ${state.batting} keeping the scoreboard ticking.`;
  }


  async function generateAIInsight() {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `Analyze this IPL match situation for ${matchState.homeTeam} vs ${matchState.awayTeam}: ${matchState.score}/${matchState.wickets} in ${matchState.overs}.${matchState.ballsInOver} overs. Current batter: ${matchState.striker}. Give a 1-sentence tactical insight.`;
      const result = await model.generateContent(prompt);
      io.emit("aiInsight", {
        id: Date.now().toString(),
        text: result.response.text().trim(),
        type: 'TACTICAL',
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("AI Insight error:", e);
    }
  }

  // Simulations
  setInterval(() => {
    if (matchState.status === "LIVE" && matchState.overs < 20 && matchState.wickets < 10) {
      simulateBall();
    } else if (matchState.status === "FINISHED") {
      io.emit("matchUpdate", matchState);
    }
  }, 2000);

  // Periodically send AI insights (every 30s)
  setInterval(() => {
    if (matchState.status === "LIVE") generateAIInsight();
  }, 30000);

  // Pulse emission every second for high responsiveness
  setInterval(() => {
    io.emit("matchUpdate", matchState);
  }, 1000);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Immediate send on connect
    socket.emit("matchUpdate", matchState);
    if (currentPoll) socket.emit("activePoll", currentPoll);
    
    socket.on("sendReaction", (emoji) => {
      io.emit("newReaction", { emoji, timestamp: Date.now() });
    });
    
    socket.on("submitPrediction", (data) => {
      console.log("Prediction received:", data);
    });

    socket.on("ping", () => socket.emit("pong"));
  });

  // Poll generation logic
  function emitDynamicPoll() {
    if (!matchState) return;
    const battingSquad = getPlayersForTeam(matchState.batting);
    const options = [battingSquad[0], battingSquad[1], "Neither"];
    
    currentPoll = {
      id: `poll_${Date.now()}`,
      matchId: matchState.id,
      question: `Who will hit the next boundary for ${matchState.batting}?`,
      options: options,
      active: true,
      results: [33, 33, 34]
    };
    
    io.emit("activePoll", currentPoll);
  }

  // Initial poll
  setTimeout(emitDynamicPoll, 5000);
  // New poll every 2 minutes
  setInterval(emitDynamicPoll, 120000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
