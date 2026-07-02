import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    category: String,
    subCategory: String,
    search: String,
    path: String,
  },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    image: String,
    alt: String,
    link: linkSchema,
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const bannerCardSchema = new mongoose.Schema(
  {
    title: String,
    eyebrow: String,
    text: String,
    cta: String,
    image: String,
    link: linkSchema,
    tone: String,
    dark: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const categoryCardSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    category: String,
    subCategory: String,
    search: String,
    path: String,
    keywords: [String],
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const homeContentSchema = new mongoose.Schema(
  {
    key: { type: String, default: "home", unique: true },
    heroSlides: [heroSlideSchema],
    categoryCards: [categoryCardSchema],
    featuredProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    bannerCards: [bannerCardSchema],
  },
  { timestamps: true }
);

export default mongoose.model("HomeContent", homeContentSchema);
