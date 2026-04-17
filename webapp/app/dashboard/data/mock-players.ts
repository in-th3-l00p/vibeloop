import type { Player, ChatMessage } from "../types";

export const lobbyPlayers: (Player & { banner: string })[] = [
  { name: "xViper", tag: "viper", status: "ready", banner: "linear-gradient(135deg, #6d28d9, #db2777, #f59e0b)", accent: "#a855f7", bio: "ranked demon" },
  { name: "NovaKid", tag: "nova", status: "ready", banner: "linear-gradient(135deg, #0ea5e9, #06b6d4, #22d3ee)", accent: "#22d3ee", bio: "chill vibes only" },
  { name: "GhostRacer", tag: "ghost", status: "idle", banner: "linear-gradient(135deg, #f97316, #ef4444, #dc2626)", accent: "#f97316", bio: "speed is everything" },
  { name: "ZenithX", tag: "zenith", status: "ready", banner: "linear-gradient(135deg, #10b981, #059669, #047857)", accent: "#34d399", bio: "gg ez" },
  { name: "LunaWolf", tag: "luna", status: "idle", banner: "linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95)", accent: "#a78bfa", bio: "howl at the moon" },
];

export const friendsList: (Player & { status: "online" | "in-game" | "offline" })[] = [
  { name: "xViper", tag: "viper", status: "online", accent: "#a855f7", bio: "ranked demon" },
  { name: "NovaKid", tag: "nova", status: "online", accent: "#22d3ee", bio: "chill vibes only" },
  { name: "GhostRacer", tag: "ghost", status: "in-game", accent: "#f97316", bio: "speed is everything" },
  { name: "ZenithX", tag: "zenith", status: "online", accent: "#34d399", bio: "gg ez" },
  { name: "LunaWolf", tag: "luna", status: "offline", accent: "#a78bfa", bio: "howl at the moon" },
  { name: "Blitz99", tag: "blitz", status: "online", accent: "#f43f5e", bio: "never sleeping" },
  { name: "ArcticFox", tag: "arctic", status: "offline", accent: "#38bdf8", bio: "ice cold plays" },
  { name: "Ember", tag: "ember", status: "in-game", accent: "#fb923c", bio: "burn it down" },
];

export const lobbyMessages: ChatMessage[] = [
  { from: "xViper", accent: "#a855f7", text: "yo who's ready to run it", time: "2:31 PM" },
  { from: "NovaKid", accent: "#22d3ee", text: "let's gooo", time: "2:31 PM" },
  { from: "GhostRacer", accent: "#f97316", text: "one sec grabbing a drink", time: "2:32 PM" },
  { from: "xViper", accent: "#a855f7", text: "hurry up ghost we're all waiting", time: "2:33 PM" },
  { from: "ZenithX", accent: "#34d399", text: "gg ez incoming", time: "2:33 PM" },
  { from: "LunaWolf", accent: "#a78bfa", text: "don't jinx it lol", time: "2:34 PM" },
  { from: "NovaKid", accent: "#22d3ee", text: "luna's right, last time you said that we got destroyed", time: "2:34 PM" },
  { from: "GhostRacer", accent: "#f97316", text: "ok i'm back, let's go", time: "2:35 PM" },
];

export const playerNames = lobbyPlayers.map((p) => p.name);
