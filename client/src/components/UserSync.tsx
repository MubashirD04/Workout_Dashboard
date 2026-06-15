import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

/**
 * Syncs the Clerk user identity with the Convex users table.
 * Render this component once inside your ConvexProvider.
 */
export function UserSync() {
  const { user, isSignedIn } = useUser();
  const upsert = useMutation((api as any).users.upsertCurrentUser);

  useEffect(() => {
    if (isSignedIn && user) {
      // SECURITY: We no longer pass name/email/clerkId here.
      // The backend derives them from the verified JWT identity.
      upsert({});
    }
  }, [isSignedIn, user, upsert]);

  return null;
}
