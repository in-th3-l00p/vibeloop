/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chainSync from "../chainSync.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as friends from "../friends.js";
import type * as gameStats from "../gameStats.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as lib_getUserCardTheme from "../lib/getUserCardTheme.js";
import type * as lobbies from "../lobbies.js";
import type * as lobbyInvitations from "../lobbyInvitations.js";
import type * as marketplace from "../marketplace.js";
import type * as nft from "../nft.js";
import type * as poker_engine from "../poker/engine.js";
import type * as poker_helpers from "../poker/helpers.js";
import type * as poker_mutations from "../poker/mutations.js";
import type * as poker_queries from "../poker/queries.js";
import type * as presence from "../presence.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chainSync: typeof chainSync;
  chat: typeof chat;
  crons: typeof crons;
  friends: typeof friends;
  gameStats: typeof gameStats;
  games: typeof games;
  http: typeof http;
  "lib/getUserCardTheme": typeof lib_getUserCardTheme;
  lobbies: typeof lobbies;
  lobbyInvitations: typeof lobbyInvitations;
  marketplace: typeof marketplace;
  nft: typeof nft;
  "poker/engine": typeof poker_engine;
  "poker/helpers": typeof poker_helpers;
  "poker/mutations": typeof poker_mutations;
  "poker/queries": typeof poker_queries;
  presence: typeof presence;
  seed: typeof seed;
  sessions: typeof sessions;
  settings: typeof settings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
