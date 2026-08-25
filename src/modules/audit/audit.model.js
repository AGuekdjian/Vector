import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    requestId: String,
    operationId: { type: String, unique: true, sparse: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ entityType: 1, entityId: 1, createdAt: -1 });
export const AuditEvent =
  mongoose.models.AuditEvent || mongoose.model("AuditEvent", schema);
