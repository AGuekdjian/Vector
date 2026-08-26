import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    operationId: { type: String, unique: true, sparse: true, index: true },
    installationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installation",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"],
      required: true,
    },
    brand: { type: String, trim: true, maxlength: 100 },
    model: { type: String, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 2000 },
    technicalNotes: { type: String, maxlength: 4000 },
    installedAt: Date,
    imei: { type: String, trim: true },
    serialNumber: { type: String, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["ACTIVE", "RETIRED", "REPLACED"],
      default: "ACTIVE",
      index: true,
    },
    installedByServiceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOrder",
    },
    removedByServiceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOrder",
    },
    removedOperationId: { type: String, index: true, sparse: true },
    retiredAt: Date,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
schema.index({ installationId: 1, active: 1, status: 1 });
export const InstalledSystem =
  mongoose.models.InstalledSystem || mongoose.model("InstalledSystem", schema);
