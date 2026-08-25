import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    windowStartedAt: { type: Date, default: Date.now },
    blockedUntil: Date,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LoginThrottle =
  mongoose.models.LoginThrottle || mongoose.model("LoginThrottle", schema);
