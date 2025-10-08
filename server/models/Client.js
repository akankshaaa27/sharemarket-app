import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ClientSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "active",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: { type: String, trim: true },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "ClientProfile",
    },
  },
  { timestamps: true },
);

ClientSchema.index({ assignedTo: 1 });

export default mongoose.models.Client || model("Client", ClientSchema);
