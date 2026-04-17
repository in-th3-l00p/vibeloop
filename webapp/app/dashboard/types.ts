export type Rarity = "free" | "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface ProfileCardTheme {
  id: string;
  name: string;
  nameBg: string;
  nameColor: string;
  tagColor: string;
  descColor: string;
  statColor: string;
  labelColor: string;
  borderColor: string;
  avatarRing: string;
  divider: string;
  price: number;
  rarity: Rarity;
}

export interface UiTheme {
  name: string;
  cardBg: string;
  cardRing: string;
  textMuted: string;
}

export interface DashboardSettings {
  profileCardTheme: string;
  welcomeText: string;
  titleColor: string;
  pageBg: string;
  uiTheme: number;
  showWelcome: boolean;
  showLobby: boolean;
  showGames: boolean;
  showMarketplace: boolean;
  compactMode: boolean;
  glowEffects: boolean;
}

export interface Player {
  name: string;
  tag: string;
  accent: string;
  bio: string;
  status: string;
  banner?: string;
}

export interface Game {
  name: string;
  desc: string;
  players: string;
  tag: string;
  accent: string;
  gradient: string;
  emoji: string;
}

export interface MarketplaceItem {
  name: string;
  type: string;
  price: string;
  accent: string;
  gradient: string;
  rarity: string;
}

export interface ChatMessage {
  from: string;
  accent: string;
  text: string;
  time: string;
}
