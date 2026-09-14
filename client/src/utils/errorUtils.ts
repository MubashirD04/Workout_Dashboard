import { ConvexError } from "convex/values";

/**
 * Turns a thrown Convex mutation/action error into text safe to show a user.
 *
 * - ConvexError (expected failures, e.g. "Cannot demote the last admin.")
 *   carries its message in `data`, on dev and prod deployments alike.
 * - Anything else is an unexpected server error: on prod Convex redacts it
 *   to "Server Error", and on dev its message is wrapped in request metadata
 *   and a stack trace — so show the caller's fallback instead.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
    if (err instanceof ConvexError && typeof err.data === "string") {
        return err.data;
    }
    return fallback;
}
