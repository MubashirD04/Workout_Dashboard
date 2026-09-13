// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook — keeps Convex in sync when a user is deleted directly in
// Clerk (dashboard, self-service account deletion, etc). Configure this URL
// as an endpoint in the Clerk dashboard, subscribed to the "user.deleted"
// event, and set CLERK_WEBHOOK_SECRET (the endpoint's signing secret) via
// `npx convex env set CLERK_WEBHOOK_SECRET whsec_...`.
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET not set — rejecting Clerk webhook.");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();

    try {
      const wh = new Webhook(webhookSecret);
      // Throws if the signature doesn't match; doesn't return the payload.
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Clerk webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body) as { type: string; data: { id: string } };

    if (event.type === "user.deleted") {
      await ctx.runMutation(internal.users.deleteUserByClerkId, {
        clerkId: event.data.id,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
