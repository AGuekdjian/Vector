import "server-only";
import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env/server";

globalThis.__mongoose ??= { connection: null, promise: null };

export async function connectDatabase() {
  if (globalThis.__mongoose.connection) return globalThis.__mongoose.connection;
  globalThis.__mongoose.promise ??= mongoose.connect(
    getServerEnv().MONGODB_URI,
    { bufferCommands: false, maxPoolSize: 10, serverSelectionTimeoutMS: 5_000 },
  );
  try {
    globalThis.__mongoose.connection = await globalThis.__mongoose.promise;
  } catch (error) {
    globalThis.__mongoose.promise = null;
    throw error;
  }
  return globalThis.__mongoose.connection;
}
