import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DmatAccountSchema = new Schema(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    holderName: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    renewalStatus: {
      type: String,
      enum: ["Active", "Expired", "Pending", "Expiring"],
      default: "Active",
    },
  },
  { timestamps: true },
);

export default mongoose.models.DmatAccount ||
  model("DmatAccount", DmatAccountSchema);
