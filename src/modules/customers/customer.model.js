import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    customerType: { type: String, enum: ["PERSON", "COMPANY"], required: true },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100 },
    companyName: { type: String, trim: true, maxlength: 160 },
    primaryPhone: { type: String, required: true, trim: true, maxlength: 40 },
    secondaryPhone: { type: String, trim: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    subscriber: { type: Boolean, required: true },
    customerSince: Date,
    contractStart: Date,
    contractEnd: Date,
    paymentMethod: { type: String, maxlength: 100 },
    internalNotes: { type: String, maxlength: 4000 },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
schema.index({ lastName: 1, firstName: 1, active: 1 });
schema.index({ companyName: 1, active: 1 });
schema.index({ primaryPhone: 1 });
export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", schema);
