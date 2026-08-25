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
schema.index(
  { processedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90,
    partialFilterExpression: { processedAt: { $type: "date" } },
  },
);
export const SyncOperation =
  mongoose.models.SyncOperation || mongoose.model("SyncOperation", schema);
