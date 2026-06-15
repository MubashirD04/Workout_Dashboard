// client/src/hooks/useCurrentUser.ts
// Provides the authenticated user record from Convex, plus role-based helpers.

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useCurrentUser() {
  const user = useQuery((api as any).users.getCurrentUser);

  return {
    user,
    isLoading: user === undefined,
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    isClient: user?.role === "client",
    canViewClients: user?.role === "admin" || user?.role === "trainer",
  };
}
