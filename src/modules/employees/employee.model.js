import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
schema.index({ lastName: 1, firstName: 1, active: 1 });
export const Employee =
  mongoose.models.Employee || mongoose.model("Employee", schema);
