import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  images: [String],
  category: String,
  subCategory: String,
  inspiration: String,
  design: [String],
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      name: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  sold: {
    type: Number,
    default: 0
  },

  avgRating: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
