// client/src/hooks/useCurrentUser.ts
// Provides the authenticated user record from Convex, plus role-based helpers.

import { useRef } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const rawUser = useQuery(
    (api as any).users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const cachedUser = useRef(rawUser);
  if (rawUser !== undefined) {
    cachedUser.current = rawUser;
  }
  const user = rawUser !== undefined ? rawUser : cachedUser.current;

  return {
    user,
    isLoading: authLoading || (isAuthenticated && user === undefined),
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    isClient: user?.role === "client",
    canViewClients: user?.role === "admin" || user?.role === "trainer",
  };
}