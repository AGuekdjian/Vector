import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    department: { type: String, trim: true, maxlength: 100 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
schema.index({ customerId: 1, active: 1 });
export const Installation =
  mongoose.models.Installation || mongoose.model("Installation", schema);
