import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sweep stale presence records every 2 minutes
crons.interval(
  "mark offline users",
  { minutes: 2 },
  internal.presence.markOffline,
  {},
);

// Poll for NFT transfer events every minute
crons.interval(
  "poll nft transfers",
  { minutes: 1 },
  internal.chainSync.pollTransfers,
  {},
);

// Refresh $VIBE balances every 5 minutes
crons.interval(
  "poll vibe balances",
  { minutes: 5 },
  internal.chainSync.pollVibeBalances,
  {},
);

export default crons;
