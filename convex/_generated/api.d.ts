/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as athleteProfile from "../athleteProfile.js";
import type * as audit from "../audit.js";
import type * as bodyMetrics from "../bodyMetrics.js";
import type * as cardioLogs from "../cardioLogs.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as lib_auth from "../lib/auth.js";
import type * as logs from "../logs.js";
import type * as nutritionLogs from "../nutritionLogs.js";
import type * as progressPhotos from "../progressPhotos.js";
import type * as users from "../users.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  athleteProfile: typeof athleteProfile;
  audit: typeof audit;
  bodyMetrics: typeof bodyMetrics;
  cardioLogs: typeof cardioLogs;
  chat: typeof chat;
  crons: typeof crons;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  "lib/auth": typeof lib_auth;
  logs: typeof logs;
  nutritionLogs: typeof nutritionLogs;
  progressPhotos: typeof progressPhotos;
  users: typeof users;
  workouts: typeof workouts;
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
