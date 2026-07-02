import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  images: [String],
  videoUrl: String,
  category: String,
  subCategory: String,
  inspiration: String,
  design: [String],
  quantity: { type: Number, default: 0 },
  makingCharge: Number,
  materials: [
    {
      metal: String,
      weight: Number,
      rate: Number,
    }
  ],
  variantGroups: [
    {
      name: String,
      options: [
        {
          label: String,
          image: String,
          price: Number,
        }
      ],
    }
  ],
  variantCombinations: [
    {
      selections: [
        {
          group: String,
          option: String,
        }
      ],
      price: Number,
      image: String,
      images: [String],
      quantity: Number,
      metal: String,
      weight: Number,
      rate: Number,
      makingCharge: Number,
    }
  ],
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      name: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      images: [String],
      createdAt: { type: Date, default: Date.now }
    }
  ],
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  sold: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
