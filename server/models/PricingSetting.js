import mongoose from "mongoose";

const pricingSettingSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  makingCharge: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export default mongoose.model("PricingSetting", pricingSettingSchema);
