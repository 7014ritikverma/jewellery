import express from "express";
import mongoose from "mongoose";
import HomeContent from "../models/HomeContent.js";
import Product from "../models/Product.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

const cleanString = (value = "") => String(value || "").trim();

const normalizeLink = (link = {}) => ({
  category: cleanString(link.category),
  subCategory: cleanString(link.subCategory),
  search: cleanString(link.search),
  path: cleanString(link.path),
});

const normalizeHeroSlides = (slides = []) => (
  Array.isArray(slides) ? slides : []
).map((slide) => ({
  image: cleanString(slide.image),
  alt: cleanString(slide.alt),
  link: normalizeLink(slide.link),
  isActive: slide.isActive !== false,
})).filter((slide) => slide.image);

const normalizeBannerCards = (cards = []) => (
  Array.isArray(cards) ? cards : []
).map((card) => ({
  title: cleanString(card.title),
  eyebrow: cleanString(card.eyebrow),
  text: cleanString(card.text),
  cta: cleanString(card.cta) || "Shop Now",
  image: cleanString(card.image),
  link: normalizeLink(card.link),
  tone: cleanString(card.tone) || "from-[#fbe1e6] to-[#fff6f0]",
  dark: Boolean(card.dark),
  isActive: card.isActive !== false,
})).filter((card) => card.image);

const normalizeCategoryCards = (cards = []) => (
  Array.isArray(cards) ? cards : []
).map((card) => ({
  name: cleanString(card.name),
  image: cleanString(card.image),
  category: cleanString(card.category),
  subCategory: cleanString(card.subCategory),
  search: cleanString(card.search),
  path: cleanString(card.path),
  keywords: Array.isArray(card.keywords)
    ? card.keywords.map(cleanString).filter(Boolean)
    : String(card.keywords || "")
      .split(",")
      .map(cleanString)
      .filter(Boolean),
  isActive: card.isActive !== false,
})).filter((card) => card.name && card.image);

const getHomeContent = async () => {
  return HomeContent.findOne({ key: "home" }).populate("featuredProduct");
};

router.get("/", async (req, res) => {
  try {
    const content = await getHomeContent();
    res.json(content || {});
  } catch (err) {
    console.log(err);
    res.status(500).json("Home content unavailable");
  }
});

router.put("/", adminAuth, async (req, res) => {
  try {
    const featuredProduct = cleanString(req.body.featuredProduct);

    if (featuredProduct) {
      if (!mongoose.Types.ObjectId.isValid(featuredProduct)) {
        return res.status(400).json("Selected featured product is invalid");
      }

      const exists = await Product.exists({ _id: featuredProduct });
      if (!exists) return res.status(400).json("Selected featured product was not found");
    }

    const content = await HomeContent.findOneAndUpdate(
      { key: "home" },
      {
        key: "home",
        heroSlides: normalizeHeroSlides(req.body.heroSlides),
        categoryCards: normalizeCategoryCards(req.body.categoryCards),
        featuredProduct: featuredProduct || null,
        bannerCards: normalizeBannerCards(req.body.bannerCards),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("featuredProduct");

    res.json(content);
  } catch (err) {
    console.log(err);
    res.status(500).json("Home content update failed");
  }
});

export default router;
