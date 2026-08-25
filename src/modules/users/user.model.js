import mongoose from "mongoose";

export const ROLES = ["OWNER", "ADMIN", "TECHNICIAN"];
const schema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    sessionVersion: { type: Number, default: 0, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
schema.index({ username: 1, active: 1 });
export const User = mongoose.models.User || mongoose.model("User", schema);
