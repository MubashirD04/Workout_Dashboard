import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("prune old logs", { hours: 24 }, internal.logs.pruneLogs, {});

export default crons;
