import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    operationId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: { type: String, required: true },
    entityId: mongoose.Schema.Types.ObjectId,
    payloadHash: { type: String, required: true },
    result: mongoose.Schema.Types.Mixed,
    processedAt: Date,
    processingUntil: Date,
  },
  { timestamps: true },
);
export const SyncOperation =
  mongoose.models.SyncOperation || mongoose.model("SyncOperation", schema);
