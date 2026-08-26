import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    level: { type: String, enum: ["ERROR", "WARNING"], required: true },
    message: { type: String, required: true, maxlength: 2000 },
    code: { type: String, maxlength: 100, index: true },
    requestId: { type: String, maxlength: 120, index: true },
    method: { type: String, maxlength: 12 },
    path: { type: String, maxlength: 500, index: true },
    status: Number,
    durationMs: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ createdAt: -1, level: 1 });

export const SystemEvent =
  mongoose.models.SystemEvent || mongoose.model("SystemEvent", schema);
