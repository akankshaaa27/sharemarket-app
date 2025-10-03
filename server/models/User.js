import mongoose from "mongoose";

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, unique: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["admin", "employee", "client"], default: "client", index: true },
    passwordHash: { type: String, required: true },
    passwordPlain: { type: String, default: null }, // Admin-only visibility per spec (security risk)
    createdAt: { type: Date, default: Date.now },
    assignedClientIds: [{ type: Schema.Types.ObjectId, ref: "ClientProfile" }],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, username: 1 });

export default mongoose.models.User || model("User", UserSchema);
