import type { Game } from "../types";

export const games: Game[] = [
  { name: "Vibecheck", desc: "Vote on hot takes. Majority wins.", players: "2–10", tag: "party", accent: "#a855f7", gradient: "linear-gradient(135deg, #6d28d9, #db2777)", emoji: "🔥" },
  { name: "Drawl", desc: "Sketch prompts. Friends guess blind.", players: "3–8", tag: "creative", accent: "#22d3ee", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)", emoji: "🎨" },
  { name: "Bluff Royale", desc: "Lie your way to victory. Trust no one.", players: "4–10", tag: "strategy", accent: "#f97316", gradient: "linear-gradient(135deg, #f97316, #ef4444)", emoji: "🃏" },
  { name: "Wavelength", desc: "Guess where your friend lands on the spectrum.", players: "2–8", tag: "social", accent: "#34d399", gradient: "linear-gradient(135deg, #10b981, #059669)", emoji: "📡" },
  { name: "Speed Trivia", desc: "First to buzz wins. No second chances.", players: "2–12", tag: "trivia", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #eab308)", emoji: "⚡" },
  { name: "Conspirators", desc: "Find the traitor before it's too late.", players: "5–10", tag: "deception", accent: "#f43f5e", gradient: "linear-gradient(135deg, #e11d48, #9f1239)", emoji: "🕵️" },
  { name: "Wordsmith", desc: "Build words from scrambled letters. Fastest wins.", players: "2–6", tag: "word", accent: "#60a5fa", gradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "🔤" },
  { name: "Reflex", desc: "Tap the screen at the perfect moment. Milliseconds matter.", players: "2–4", tag: "reaction", accent: "#c084fc", gradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "🎯" },
  { name: "Alibi", desc: "Craft your story. Spot the lies in theirs.", players: "4–8", tag: "social", accent: "#fb923c", gradient: "linear-gradient(135deg, #ea580c, #fb923c)", emoji: "🎭" },
  { name: "Gridlock", desc: "Claim tiles. Block your opponents. Dominate the board.", players: "2–4", tag: "strategy", accent: "#2dd4bf", gradient: "linear-gradient(135deg, #0d9488, #14b8a6)", emoji: "🧩" },
  { name: "Meme Wars", desc: "Caption the image. Funniest one wins the round.", players: "3–10", tag: "party", accent: "#f472b6", gradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "😂" },
  { name: "Beat Drop", desc: "Tap to the rhythm. Stay on beat or lose.", players: "2–6", tag: "music", accent: "#e879f9", gradient: "linear-gradient(135deg, #a21caf, #d946ef)", emoji: "🎵" },
];

export const gameStats = [
  { name: "Vibecheck", played: 38, wins: 24, accent: "#a855f7" },
  { name: "Drawl", played: 29, wins: 18, accent: "#22d3ee" },
  { name: "Bluff Royale", played: 31, wins: 20, accent: "#f97316" },
  { name: "Wavelength", played: 22, wins: 14, accent: "#34d399" },
  { name: "Speed Trivia", played: 14, wins: 7, accent: "#fbbf24" },
  { name: "Conspirators", played: 8, wins: 4, accent: "#f43f5e" },
];
