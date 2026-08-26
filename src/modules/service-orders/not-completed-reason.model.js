import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      unique: true,
    },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const NotCompletedReason =
  mongoose.models.NotCompletedReason ||
  mongoose.model("NotCompletedReason", schema);
