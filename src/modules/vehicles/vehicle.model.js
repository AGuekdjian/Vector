import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
export const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", schema);
