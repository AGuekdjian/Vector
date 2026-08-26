import mongoose from "mongoose";
export const ORDER_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "REQUIRES_QUOTE",
  "NOT_COMPLETED",
  "RESCHEDULED",
];
const timelineSchema = new mongoose.Schema(
  {
    operationId: { type: String, index: true, sparse: true },
    action: { type: String, required: true },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);
const schema = new mongoose.Schema(
  {
    externalOrderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    installationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installation",
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      enum: ["INSTALLATION", "MAINTENANCE", "REPAIR", "INSPECTION", "OTHER"],
      default: "MAINTENANCE",
      required: true,
    },
    responsibleTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    companionEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, required: true },
    sequence: { type: Number, default: 0 },
    workDescription: { type: String, required: true, maxlength: 4000 },
    technicianNote: { type: String, maxlength: 4000 },
    internalNote: { type: String, maxlength: 4000, select: false },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "PENDING",
      index: true,
    },
    completionResult: {
      type: String,
      enum: ["COMPLETED", "REQUIRES_QUOTE", "NOT_COMPLETED"],
    },
    technicianObservation: { type: String, maxlength: 4000 },
    quoteDetails: { type: String, maxlength: 4000 },
    notCompletedReasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotCompletedReason",
    },
    parentServiceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOrder",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: Date,
    completedAt: Date,
    active: { type: Boolean, default: true, index: true },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true },
);
schema.index({
  responsibleTechnicianId: 1,
  scheduledDate: 1,
  status: 1,
  active: 1,
});
schema.index({ customerId: 1, createdAt: -1 });
schema.index({ active: 1, scheduledDate: -1, status: 1 });
schema.index({ customerId: 1, active: 1, scheduledDate: -1 });
schema.index({ installationId: 1, active: 1, completedAt: -1 });
export const ServiceOrder =
  mongoose.models.ServiceOrder || mongoose.model("ServiceOrder", schema);
