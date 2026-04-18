// Pure poker logic — no Convex dependencies, fully testable

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
const SUITS = ["h", "d", "c", "s"] as const;

export type Card = string; // e.g. "Ah", "Tc"

export interface HandResult {
  rank: number; // 0=high card … 9=royal flush
  name: string;
  tiebreakers: number[]; // ordered values for comparison
}

export interface PlayerState {
  userId: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBetThisRound: number;
  folded: boolean;
  allIn: boolean;
  eliminated: boolean;
  seatIndex: number;
}

export interface Pot {
  amount: number;
  eligible: string[]; // userIds
}

export interface WinnerResult {
  userId: string;
  amount: number;
  handName: string;
}

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function dealCards(
  deck: Card[],
  count: number,
): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

// ---------------------------------------------------------------------------
// Card parsing
// ---------------------------------------------------------------------------

function rankValue(card: Card): number {
  return RANKS.indexOf(card[0] as (typeof RANKS)[number]);
}

function suitOf(card: Card): string {
  return card[1];
}

// ---------------------------------------------------------------------------
// Hand evaluation
// ---------------------------------------------------------------------------

function getCombinations(arr: Card[], size: number): Card[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const result: Card[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getCombinations(arr.slice(i + 1), size - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}

function evaluate5(cards: Card[]): HandResult {
  const values = cards.map(rankValue).sort((a, b) => b - a);
  const suits = cards.map(suitOf);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = values[0];

  // Normal straight check
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  }

  // Ace-low straight (A-2-3-4-5)
  if (
    !isStraight &&
    values[0] === 12 &&
    values[1] === 3 &&
    values[2] === 2 &&
    values[3] === 1 &&
    values[4] === 0
  ) {
    isStraight = true;
    straightHigh = 3; // 5-high straight
  }

  // Count ranks
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const groups = Object.entries(counts)
    .map(([val, cnt]) => ({ val: Number(val), cnt }))
    .sort((a, b) => b.cnt - a.cnt || b.val - a.val);

  // Royal flush
  if (isFlush && isStraight && straightHigh === 12) {
    return { rank: 9, name: "Royal Flush", tiebreakers: [12] };
  }

  // Straight flush
  if (isFlush && isStraight) {
    return {
      rank: 8,
      name: "Straight Flush",
      tiebreakers: [straightHigh],
    };
  }

  // Four of a kind
  if (groups[0].cnt === 4) {
    return {
      rank: 7,
      name: "Four of a Kind",
      tiebreakers: [groups[0].val, groups[1].val],
    };
  }

  // Full house
  if (groups[0].cnt === 3 && groups[1].cnt === 2) {
    return {
      rank: 6,
      name: "Full House",
      tiebreakers: [groups[0].val, groups[1].val],
    };
  }

  // Flush
  if (isFlush) {
    return { rank: 5, name: "Flush", tiebreakers: values };
  }

  // Straight
  if (isStraight) {
    return { rank: 4, name: "Straight", tiebreakers: [straightHigh] };
  }

  // Three of a kind
  if (groups[0].cnt === 3) {
    const kickers = groups
      .filter((g) => g.cnt === 1)
      .map((g) => g.val)
      .sort((a, b) => b - a);
    return {
      rank: 3,
      name: "Three of a Kind",
      tiebreakers: [groups[0].val, ...kickers],
    };
  }

  // Two pair
  if (groups[0].cnt === 2 && groups[1].cnt === 2) {
    const pairs = [groups[0].val, groups[1].val].sort((a, b) => b - a);
    const kicker = groups[2].val;
    return {
      rank: 2,
      name: "Two Pair",
      tiebreakers: [...pairs, kicker],
    };
  }

  // One pair
  if (groups[0].cnt === 2) {
    const kickers = groups
      .filter((g) => g.cnt === 1)
      .map((g) => g.val)
      .sort((a, b) => b - a);
    return {
      rank: 1,
      name: "Pair",
      tiebreakers: [groups[0].val, ...kickers],
    };
  }

  // High card
  return { rank: 0, name: "High Card", tiebreakers: values };
}

export function evaluateHand(
  holeCards: Card[],
  communityCards: Card[],
): HandResult {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);

  let best: HandResult | null = null;
  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }

  return best!;
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? -1;
    const bv = b.tiebreakers[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0; // tie
}

// ---------------------------------------------------------------------------
// Pot calculation
// ---------------------------------------------------------------------------

export function calculatePots(players: PlayerState[]): Pot[] {
  // Get all unique bet levels from non-folded players who contributed
  const activePlayers = players.filter((p) => !p.eliminated);
  const allBets = activePlayers
    .map((p) => p.totalBetThisRound)
    .filter((b) => b > 0);
  const uniqueLevels = [...new Set(allBets)].sort((a, b) => a - b);

  if (uniqueLevels.length === 0) {
    return [{ amount: 0, eligible: [] }];
  }

  const pots: Pot[] = [];
  let prevLevel = 0;

  for (const level of uniqueLevels) {
    const diff = level - prevLevel;
    if (diff <= 0) continue;

    let amount = 0;
    const eligible: string[] = [];

    for (const p of activePlayers) {
      if (p.totalBetThisRound >= level) {
        amount += diff;
        if (!p.folded) {
          eligible.push(p.userId);
        }
      }
    }

    if (amount > 0) {
      pots.push({ amount, eligible });
    }
    prevLevel = level;
  }

  // Merge pots with identical eligible lists
  const merged: Pot[] = [];
  for (const pot of pots) {
    const eligKey = [...pot.eligible].sort().join(",");
    const existing = merged.find(
      (m) => [...m.eligible].sort().join(",") === eligKey,
    );
    if (existing) {
      existing.amount += pot.amount;
    } else {
      merged.push({ ...pot });
    }
  }

  return merged.length > 0 ? merged : [{ amount: 0, eligible: [] }];
}

// ---------------------------------------------------------------------------
// Winner determination
// ---------------------------------------------------------------------------

export interface PotWinner {
  userId: string;
  amount: number;
  handName: string;
}

export function determineWinners(
  players: PlayerState[],
  communityCards: Card[],
  pots: Pot[],
): PotWinner[] {
  const winners: PotWinner[] = [];

  for (const pot of pots) {
    if (pot.eligible.length === 0 || pot.amount === 0) continue;

    const eligiblePlayers = players.filter(
      (p) => pot.eligible.includes(p.userId) && !p.folded,
    );

    if (eligiblePlayers.length === 0) continue;

    if (eligiblePlayers.length === 1) {
      winners.push({
        userId: eligiblePlayers[0].userId,
        amount: pot.amount,
        handName: "Last Standing",
      });
      continue;
    }

    // Evaluate hands
    const evaluated = eligiblePlayers.map((p) => ({
      player: p,
      hand: evaluateHand(p.holeCards, communityCards),
    }));

    // Find best hand
    evaluated.sort((a, b) => compareHands(b.hand, a.hand));
    const bestHand = evaluated[0].hand;

    // Find all players tied for best
    const tiedWinners = evaluated.filter(
      (e) => compareHands(e.hand, bestHand) === 0,
    );

    const share = Math.floor(pot.amount / tiedWinners.length);
    const remainder = pot.amount - share * tiedWinners.length;

    for (let i = 0; i < tiedWinners.length; i++) {
      winners.push({
        userId: tiedWinners[i].player.userId,
        amount: share + (i === 0 ? remainder : 0),
        handName: tiedWinners[i].hand.name,
      });
    }
  }

  return winners;
}

// ---------------------------------------------------------------------------
// Turn / round helpers
// ---------------------------------------------------------------------------

export function getNextActivePlayerIndex(
  players: PlayerState[],
  currentIndex: number,
): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (currentIndex + i) % n;
    const p = players[idx];
    if (!p.folded && !p.allIn && !p.eliminated) {
      return idx;
    }
  }
  return -1; // no active player
}

export function countActivePlayers(players: PlayerState[]): number {
  return players.filter((p) => !p.folded && !p.eliminated).length;
}

export function countPlayersCanAct(players: PlayerState[]): number {
  return players.filter(
    (p) => !p.folded && !p.allIn && !p.eliminated,
  ).length;
}

export function getHighestBet(players: PlayerState[]): number {
  return Math.max(0, ...players.map((p) => p.currentBet));
}

export function isRoundComplete(
  players: PlayerState[],
  currentIndex: number,
  lastAggressorIndex: number,
): boolean {
  const active = players.filter(
    (p) => !p.folded && !p.allIn && !p.eliminated,
  );

  if (active.length === 0) return true;
  if (active.length === 1) {
    // One active player, check if bets are equalized
    const highest = getHighestBet(players);
    return active[0].currentBet >= highest;
  }

  // All active players must have equal bets
  const highest = getHighestBet(players);
  return active.every((p) => p.currentBet === highest);
}
