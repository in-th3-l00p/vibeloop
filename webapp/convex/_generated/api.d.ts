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
import type * as http from "../http.js";
import type * as lobbies from "../lobbies.js";
import type * as nft from "../nft.js";
import type * as presence from "../presence.js";
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
  http: typeof http;
  lobbies: typeof lobbies;
  nft: typeof nft;
  presence: typeof presence;
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
