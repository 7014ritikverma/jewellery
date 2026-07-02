import mongoose from "mongoose";

const metalRateSchema = new mongoose.Schema({
  metal: { type: String, required: true, unique: true },
  rate: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  unit: { type: String, default: "gram" },
  source: { type: String, default: "manual" },
  providerSymbol: String,
  rawRate: Number,
  adjustmentFactor: { type: Number, default: 1 },
  lastFetchedAt: Date,
}, { timestamps: true });

export default mongoose.model("MetalRate", metalRateSchema);
