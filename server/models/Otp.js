import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true, index: true },
  purpose: { type: String, enum: ["user", "admin"], default: "user", index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  resendAvailableAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);
