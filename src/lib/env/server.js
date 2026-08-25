import "server-only";
import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1).startsWith("mongodb"),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Vector"),
  NEXT_PUBLIC_BASE_URL: z.url(),
});

let cached;
export function getServerEnv() {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
