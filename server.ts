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
    status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  }

  let matchState: CricketState = {
    id: "ipl-2026-m01",
    homeTeam: "Chennai Super Kings",
    awayTeam: "Mumbai Indians",
    batting: "Chennai Super Kings",
    bowling: "Mumbai Indians",
    score: 142,
    wickets: 3,
    overs: 15,
    ballsInOver: 2,
    crr: 9.35,
    lastBalls: ["1", "4", "0", "1", "W", "2"],
    striker: "Ruturaj Gaikwad",
    bowler: "Jasprit Bumrah",
    partnership: 24,
    status: "LIVE"
  };

  const cskPlayers = ["Ruturaj Gaikwad", "Daryl Mitchell", "Shivam Dube", "Ravindra Jadeja", "MS Dhoni"];
  const miBowlers = ["Jasprit Bumrah", "Hardik Pandya", "Gerald Coetzee", "Piyush Chawla"];

  // Initialize match with AI to find "today's" match
  async function initializeMatch() {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `It is May 2026. Suggest a realistic IPL match for today between two big teams. Return ONLY a JSON object: { "homeTeam": string, "awayTeam": string, "batting": string, "bowling": string, "score": number, "wickets": number, "overs": number, "ballsInOver": number, "striker": string, "bowler": string, "partnership": number }`;
      
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 8000))
      ]);

      const text = result.response.text().trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const data = JSON.parse(text.slice(jsonStart, jsonEnd));
      
      matchState = { ...matchState, ...data, id: `ipl-2026-ai-${Date.now()}`, status: "LIVE", lastBalls: ["1", "4", "0", "2"] };
      console.log("Match initialized via AI:", matchState);
      io.emit("matchUpdate", matchState);
    } catch (error) {
      console.error("AI Init failed or timed out, using defaults:", error);
      // Ensure we at least emit the default state to any waiting clients
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
      matchState.striker = cskPlayers[Math.floor(Math.random() * cskPlayers.length)];
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
      matchState.bowler = miBowlers[Math.floor(Math.random() * miBowlers.length)];
    }

    const totalOversAsFloat = matchState.overs + (matchState.ballsInOver / 6);
    matchState.crr = totalOversAsFloat > 0 ? parseFloat((matchState.score / totalOversAsFloat).toFixed(2)) : 0;

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
    if (matchState.overs < 20 && matchState.wickets < 10) {
      simulateBall();
    } else {
      matchState.status = "FINISHED";
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
    
    socket.on("sendReaction", (emoji) => {
      io.emit("newReaction", { emoji, timestamp: Date.now() });
    });
    
    socket.on("submitPrediction", (data) => {
      console.log("Prediction received:", data);
    });

    socket.on("ping", () => socket.emit("pong"));
  });

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
