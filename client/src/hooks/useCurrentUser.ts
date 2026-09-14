// client/src/hooks/useCurrentUser.ts
// Provides the authenticated user record from Convex, plus role-based helpers.

import { useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const rawUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  // Keep the last resolved user while the query is briefly undefined (e.g. a
  // Clerk token refresh flips isAuthenticated and skips the query), so the
  // layout and role-gated routes don't flash. Updating state during render
  // is React's pattern for deriving from a changed value; useQuery returns a
  // stable reference until the result changes, so this settles immediately.
  const [cachedUser, setCachedUser] = useState(rawUser);
  if (rawUser !== undefined && rawUser !== cachedUser) {
    setCachedUser(rawUser);
  }
  const user = rawUser !== undefined ? rawUser : cachedUser;

  return {
    user,
    isLoading: authLoading || (isAuthenticated && user === undefined),
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    isClient: user?.role === "client",
    canViewClients: user?.role === "admin" || user?.role === "trainer",
  };
}