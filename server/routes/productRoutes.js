import express from "express";
import Product from "../models/Product.js";
import MetalRate from "../models/MetalRate.js";
import PricingSetting from "../models/PricingSetting.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

const normalizeMetalName = (metal = "") => {
  const value = String(metal).trim().replace(/\s+/g, " ");
  if (!value) return "";

  const knownMetals = {
    gold: "Gold",
    "gold 24k": "Gold 24K",
    "gold 22k": "Gold 22K",
    "gold 18k": "Gold 18K",
    silver: "Silver",
  };

  return knownMetals[value.toLowerCase()] || value;
};

const calculateProductPrice = (materials, explicitPrice, rateMap = {}) => {
  const validMaterials = Array.isArray(materials)
    ? materials.filter((item) => item && item.metal && Number(item.weight) > 0)
    : [];

  if (validMaterials.length) {
    return validMaterials.reduce((sum, item) => {
      const weight = Number(item.weight) || 0;
      const globalRate = rateMap[item.metal];
      const rate = globalRate !== undefined ? Number(globalRate) : Number(item.rate || 0);
      return sum + weight * rate;
    }, 0);
  }

  const price = explicitPrice !== undefined ? Number(explicitPrice) : 0;
  return price > 0 ? price : 0;
};

const calculateMakingCharge = (basePrice = 0, percent = 0) => {
  const price = Number(basePrice) || 0;
  const percentage = Number(percent) || 0;
  return price > 0 && percentage > 0 ? (price * percentage) / 100 : 0;
};

const normalizeVariantGroups = (groups = []) => {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group) => {
      const name = String(group?.name || "").trim();
      const options = Array.isArray(group?.options) ? group.options : [];

      return {
        name,
        options: options
          .map((option) => ({
          label: String(option?.label || "").trim(),
          image: String(option?.image || "").trim(),
          price: Number(option?.price) || 0,
        }))
        .filter((option) => option.label || option.image),
      };
    })
    .filter((group) => group.name && group.options.length);
};

const calculateVariantCombinationPrice = (combo = {}, rateMap = {}) => {
  const explicitPrice = Number(combo?.price) || 0;
  const metal = normalizeMetalName(combo?.metal);
  const weight = Number(combo?.weight) || 0;
  const explicitRate = Number(combo?.rate) || 0;
  const rate = rateMap[metal] !== undefined ? Number(rateMap[metal]) : explicitRate;

  if (metal && weight > 0 && rate > 0) {
    return weight * rate;
  }

  return explicitPrice > 0 ? explicitPrice : 0;
};

const normalizeVariantCombinations = (combinations = [], rateMap = {}, globalMakingCharge = 0) => {
  if (!Array.isArray(combinations)) return [];

  return combinations
    .map((combo) => {
      const metal = normalizeMetalName(combo?.metal);
      const hasCustomMakingCharge = combo?.makingCharge !== undefined && combo?.makingCharge !== "";
      const images = Array.isArray(combo?.images)
        ? combo.images.map((image) => String(image || "").trim()).filter(Boolean)
        : [String(combo?.image || "").trim()].filter(Boolean);

      return {
        selections: Array.isArray(combo?.selections)
          ? combo.selections
            .map((selection) => ({
              group: String(selection?.group || "").trim(),
              option: String(selection?.option || "").trim(),
            }))
            .filter((selection) => selection.group && selection.option)
          : [],
        price: calculateVariantCombinationPrice(combo, rateMap),
        image: String(combo?.image || "").trim(),
        images,
        quantity: Number(combo?.quantity) || 0,
        metal,
        weight: Number(combo?.weight) || 0,
        rate: rateMap[metal] !== undefined ? Number(rateMap[metal]) : Number(combo?.rate) || 0,
        makingCharge: hasCustomMakingCharge ? Number(combo.makingCharge) || 0 : undefined,
      };
    })
    .filter((combo) => (
      combo.selections.length &&
      (
        combo.price > 0 ||
        combo.images.length > 0 ||
        combo.image ||
        combo.quantity > 0
      )
    ));
};

const buildGlobalRateMap = async () => {
  const rates = await MetalRate.find();
  return rates.reduce((map, rate) => ({
    ...map,
    [normalizeMetalName(rate.metal)]: Number(rate.rate),
  }), {});
};

const getGlobalMakingCharge = async () => {
  const setting = await PricingSetting.findOne({ key: "default" });
  return Number(setting?.makingCharge || 0);
};

const buildGlobalRateMapSafely = async () => {
  try {
    return await buildGlobalRateMap();
  } catch (err) {
    console.log("Metal rates unavailable, using saved product prices", err.message);
    return {};
  }
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePublishState = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

const applyDynamicPrice = (product, rateMap, globalMakingCharge = 0) => {
  if (!product) return product;

  const productMakingCharge = product.makingCharge !== undefined && product.makingCharge !== null
    ? Number(product.makingCharge) || 0
    : Number(globalMakingCharge) || 0;
  const materialsExist = Array.isArray(product.materials) && product.materials.some(
    (item) => item && item.metal && Number(item.weight) > 0
  );

  if (materialsExist) {
    const basePrice = calculateProductPrice(product.materials, product.price, rateMap);
    product.price = basePrice + calculateMakingCharge(basePrice, productMakingCharge);
  } else if (Number(product.price) > 0) {
    const basePrice = Number(product.price);
    product.price = basePrice + calculateMakingCharge(basePrice, productMakingCharge);
  }

  if (Array.isArray(product.variantCombinations)) {
    product.variantCombinations = product.variantCombinations.map((combo) => {
      const hasCustomMakingCharge = combo?.makingCharge !== undefined && combo?.makingCharge !== null;
      const comboMakingCharge = hasCustomMakingCharge ? Number(combo.makingCharge) || 0 : Number(globalMakingCharge) || 0;
      const basePrice = calculateVariantCombinationPrice(combo, rateMap);
      return {
        ...(typeof combo.toObject === "function" ? combo.toObject() : combo),
        price: basePrice > 0 ? basePrice + calculateMakingCharge(basePrice, comboMakingCharge) : Number(combo.price || 0),
        images: Array.isArray(combo.images) && combo.images.length
          ? combo.images
          : [combo.image].filter(Boolean),
      };
    });
  }

  return product;
};

const getDisplayPrice = (product) => {
  const variantPrices = (product?.variantCombinations || [])
    .map((combo) => Number(combo?.price || 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length) {
    return Math.min(...variantPrices);
  }

  return Number(product?.price || 0);
};

const matchesPriceRange = (product, minPrice, maxPrice) => {
  const displayPrice = getDisplayPrice(product);

  if (!Number.isFinite(displayPrice) || displayPrice <= 0) {
    return false;
  }

  if (Number.isFinite(minPrice) && minPrice > 0 && displayPrice < minPrice) {
    return false;
  }

  if (Number.isFinite(maxPrice) && maxPrice > 0 && displayPrice > maxPrice) {
    return false;
  }

  return true;
};

// 🔥 ADD PRODUCT
router.post("/", adminAuth, async (req, res) => {
  try {
    const materials = Array.isArray(req.body.materials) ? req.body.materials : [];
    const formattedMaterials = materials.map((item) => ({
      metal: normalizeMetalName(item.metal),
      weight: Number(item.weight) || 0,
      rate: Number(item.rate) || 0,
    }));

    const rateMap = await buildGlobalRateMap();
    const globalMakingCharge = await getGlobalMakingCharge();
    const missing = formattedMaterials.find(
      (item) => item.weight > 0 && item.metal && rateMap[item.metal] === undefined
    );

    if (missing) {
      return res.status(400).json(`Metal rate not defined for ${missing.metal}`);
    }

    const hasCustomMakingCharge = req.body.makingCharge !== undefined && req.body.makingCharge !== "";
    const productMakingCharge = hasCustomMakingCharge ? Number(req.body.makingCharge) || 0 : globalMakingCharge;
    const price = calculateProductPrice(formattedMaterials, req.body.price, rateMap, productMakingCharge);
    const variantCombinations = normalizeVariantCombinations(req.body.variantCombinations, rateMap, globalMakingCharge);
    const lowestVariantPrice = variantCombinations.length
      ? Math.min(...variantCombinations.map((combo) => Number(combo.price) || 0).filter((value) => value > 0))
      : 0;
    const finalPrice = price > 0 ? price : lowestVariantPrice;

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      return res.status(400).json("Please enter a valid product price or material weights.");
    }

    if (!Array.isArray(req.body.images) || !req.body.images.length) {
      return res.status(400).json("Please upload at least one product image.");
    }

    const product = new Product({
      name: String(req.body.name || "").trim(),
      price,
      category: String(req.body.category || "").trim(),
      subCategory: String(req.body.subCategory || "").trim(),
      inspiration: String(req.body.inspiration || "").trim(),
      design: Array.isArray(req.body.design) ? req.body.design : [],
      images: req.body.images,
      videoUrl: req.body.videoUrl || "",
      quantity: Number(req.body.quantity) || 0,
      makingCharge: hasCustomMakingCharge ? productMakingCharge : undefined,
      materials: formattedMaterials,
      variantGroups: normalizeVariantGroups(req.body.variantGroups),
      price: finalPrice,
      variantCombinations,
      isPublished: parsePublishState(req.body.isPublished, true),
    });

    await product.save();

    res.json(product);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


// 🔥 GET ALL PRODUCTS
router.get("/", async (req, res) => {

  try {

    const { category, subCategory, type, search, minPrice, maxPrice, metal, rating } = req.query;
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 12), 48);
    const filter = { isPublished: { $ne: false } };

    if (category) {
      filter.category = category;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    if (search) {
      const escapedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (escapedSearch) {
        filter.$or = [
          { name: { $regex: escapedSearch, $options: "i" } },
          { category: { $regex: escapedSearch, $options: "i" } },
          { subCategory: { $regex: escapedSearch, $options: "i" } },
          { inspiration: { $regex: escapedSearch, $options: "i" } },
          { design: { $regex: escapedSearch, $options: "i" } },
        ];
      }
    }

    const numericMinPrice = Number(minPrice);
    const numericMaxPrice = Number(maxPrice);
    const hasPriceFilter =
      (Number.isFinite(numericMinPrice) && numericMinPrice > 0) ||
      (Number.isFinite(numericMaxPrice) && numericMaxPrice > 0);

    const normalizedMetal = normalizeMetalName(metal);
    if (normalizedMetal) {
      filter["materials.metal"] = normalizedMetal;
    }

    const numericRating = Number(rating);
    if (Number.isFinite(numericRating) && numericRating > 0) {
      filter.avgRating = { $gte: numericRating };
    }

    let sort = { createdAt: -1, _id: -1 };

    // 🔥 NEW ARRIVAL
    if (type === "new") {
      sort = { createdAt: -1, _id: -1 };
    }

    // 🔥 BESTSELLER
    else if (type === "bestseller") {
      sort = {
        avgRating: -1,
        sold: -1,
        createdAt: -1,
        _id: -1,
      };
    }

    // 🔥 NORMAL PRODUCTS
    const productQuery = Product.find(filter).sort(sort);

    if (isPaginated && !hasPriceFilter) {
      productQuery.skip((page - 1) * limit).limit(limit);
    }

    let products = await productQuery;

    const rateMap = await buildGlobalRateMapSafely();
    const globalMakingCharge = await getGlobalMakingCharge();
    products = products.map((product) => applyDynamicPrice(product, rateMap, globalMakingCharge));
    products = hasPriceFilter
      ? products.filter((product) => matchesPriceRange(product, numericMinPrice, numericMaxPrice))
      : products;

    if (isPaginated) {
      const total = hasPriceFilter ? products.length : await Product.countDocuments(filter);
      const paginatedProducts = hasPriceFilter
        ? products.slice((page - 1) * limit, page * limit)
        : products;

      return res.json({
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

    res.json(products);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const sort = req.query.type === "bestseller"
      ? { avgRating: -1, sold: -1, createdAt: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };
    let products = await Product.find({}).sort(sort);
    const rateMap = await buildGlobalRateMapSafely();
    const globalMakingCharge = await getGlobalMakingCharge();
    products = products.map((product) => applyDynamicPrice(product, rateMap, globalMakingCharge));
    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json("Product not found");
    const rateMap = await buildGlobalRateMapSafely();
    const globalMakingCharge = await getGlobalMakingCharge();
    res.json(applyDynamicPrice(product, rateMap, globalMakingCharge));
  } catch (err) {
    res.status(500).json("Error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.isPublished === false) {
      return res.status(404).json("Product not found");
    }
    const rateMap = await buildGlobalRateMapSafely();
    const globalMakingCharge = await getGlobalMakingCharge();
    res.json(applyDynamicPrice(product, rateMap, globalMakingCharge));
  } catch (err) {
    res.status(500).json("Error");
  }
});

router.post("/:id/reviews", auth, async (req, res) => {
  try {
    const { orderId, rating, comment, reviewImages } = req.body;
    const numericRating = Number(rating);
    const images = Array.isArray(reviewImages)
      ? reviewImages.map((image) => String(image || "").trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!orderId) {
      return res.status(400).json("Order is required for review");
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json("Rating must be between 1 and 5");
    }

    if (!comment?.trim()) {
      return res.status(400).json("Review comment is required");
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      status: "Delivered",
      "items.product": req.params.id
    });

    if (!order) {
      return res.status(400).json("Review allowed only after delivered order");
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json("Product not found");
    }

    const alreadyReviewed = product.reviews.some((review) =>
      String(review.user) === req.user.id &&
      String(review.order) === String(orderId)
    );

    if (alreadyReviewed) {
      return res.status(400).json("Review already submitted for this order");
    }

    const user = await User.findById(req.user.id).select("name mobile");

    product.reviews.push({
      user: req.user.id,
      order: orderId,
      name: user?.name || user?.mobile || "Customer",
      rating: numericRating,
      comment: comment.trim(),
      images,
    });

    product.reviewCount = product.reviews.length;
    product.avgRating = Number(
      (
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviewCount
      ).toFixed(1)
    );

    await product.save();

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json("Review failed");
  }
});





// 🔥 UPDATE PRODUCT (SAFE)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json("Product not found");
    }

    product.name = req.body.name || product.name;
    product.category = req.body.category || product.category;
    product.subCategory = req.body.subCategory || product.subCategory;
    product.inspiration = req.body.inspiration || product.inspiration;
    product.design = req.body.design || product.design;
    product.images = req.body.images || product.images;
    product.videoUrl = req.body.videoUrl !== undefined ? req.body.videoUrl : product.videoUrl;
    product.quantity = req.body.quantity !== undefined ? req.body.quantity : product.quantity;
    product.isPublished = parsePublishState(req.body.isPublished, product.isPublished !== false);
    const hasCustomMakingCharge = req.body.makingCharge !== undefined && req.body.makingCharge !== "";
    product.makingCharge = hasCustomMakingCharge ? Number(req.body.makingCharge) || 0 : undefined;
    if (req.body.variantGroups !== undefined) {
      product.variantGroups = normalizeVariantGroups(req.body.variantGroups);
    }

    if (req.body.materials) {
      const materials = Array.isArray(req.body.materials) ? req.body.materials : [];
      const formattedMaterials = materials.map((item) => ({
        metal: normalizeMetalName(item.metal),
        weight: Number(item.weight) || 0,
        rate: Number(item.rate) || 0,
      }));

      const rateMap = await buildGlobalRateMap();
      const globalMakingCharge = await getGlobalMakingCharge();
      const missing = formattedMaterials.find(
        (item) => item.weight > 0 && item.metal && rateMap[item.metal] === undefined
      );

      if (missing) {
        return res.status(400).json(`Metal rate not defined for ${missing.metal}`);
      }

      product.materials = formattedMaterials;
      const productMakingCharge = hasCustomMakingCharge ? Number(req.body.makingCharge) || 0 : globalMakingCharge;
      product.price = calculateProductPrice(formattedMaterials, req.body.price, rateMap, productMakingCharge);
      if (req.body.variantCombinations !== undefined) {
        product.variantCombinations = normalizeVariantCombinations(req.body.variantCombinations, rateMap, globalMakingCharge);
      }
    } else {
      product.price = req.body.price !== undefined ? Number(req.body.price) : product.price;
      if (req.body.variantCombinations !== undefined) {
        const rateMap = await buildGlobalRateMap();
        const globalMakingCharge = await getGlobalMakingCharge();
        product.variantCombinations = normalizeVariantCombinations(req.body.variantCombinations, rateMap, globalMakingCharge);
      }
    }

    await product.save();

    res.json(product);

  } catch (err) {
    console.log(err);
    res.status(500).json("Update Error ❌");
  }
});


// 🔥 DELETE PRODUCT
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json("Product Deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
