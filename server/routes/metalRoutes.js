import express from "express";
import Product from "../models/Product.js";
import MetalRate from "../models/MetalRate.js";
import PricingSetting from "../models/PricingSetting.js";
import { adminAuth } from "../middleware/auth.js";
import { fetchAndUpdateMetalRates } from "../utils/fetchMetalRates.js";

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

const metalRegex = (metal) => new RegExp(`^${String(metal).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

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

const calculateVariantPrice = (combo = {}, rateMap = {}, globalMakingCharge = 0) => {
  const metal = normalizeMetalName(combo.metal);
  const weight = Number(combo.weight) || 0;
  const rate = rateMap[metal] !== undefined ? Number(rateMap[metal]) : Number(combo.rate || 0);

  if (metal && weight > 0 && rate > 0) {
    return weight * rate;
  }

  const price = Number(combo.price) || 0;
  return price > 0 ? price : 0;
};

// const calculateVariantPrice = (
//   combo = {},
//   rateMap = {},
//   makingCharge = 0
// ) => {
//   const metal = normalizeMetalName(combo.metal);
//   const weight = Number(combo.weight) || 0;

//   const rate =
//     rateMap[metal] !== undefined
//       ? Number(rateMap[metal])
//       : Number(combo.rate || 0);

//   if (metal && weight > 0 && rate > 0) {
//     return weight * rate + makingCharge;
//   }

//   const price = Number(combo.price) || 0;
//   return price > 0 ? price + makingCharge : 0;
// };

const buildGlobalRateMap = async () => {
  const rates = await MetalRate.find();
  return rates.reduce((map, rate) => ({
    ...map,
    [normalizeMetalName(rate.metal)]: Number(rate.rate),
  }), {});
};

const getPricingSetting = async () => {
  return PricingSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", makingCharge: 0 } },
    { upsert: true, returnDocument: "after" }
  );
};

const getSortedRates = () => MetalRate.find().sort({ metal: 1 });

const refreshAllProductPrices = async () => {
  const rateMap = await buildGlobalRateMap();
  const pricingSetting = await getPricingSetting();
  const globalMakingCharge = Number(pricingSetting?.makingCharge || 0);
  const products = await Product.find({
    $or: [
      { "materials.0": { $exists: true } },
      { "variantCombinations.0": { $exists: true } },
    ],
  });

  const operations = products.map((product) => {
    const newPrice = calculateProductPrice(product.materials, product.price, rateMap);

    // const productMakingCharge =
    //   product.makingCharge !== undefined &&
    //     product.makingCharge !== null
    //     ? Number(product.makingCharge) || 0
    //     : globalMakingCharge;

    // const newPrice =
    //   calculateProductPrice(
    //     product.materials,
    //     product.price,
    //     rateMap
    //   ) + productMakingCharge;

    const updatedMaterials = (product.materials || []).map((item) => ({
      metal: item.metal,
      weight: Number(item.weight) || 0,
      rate: rateMap[item.metal] !== undefined ? Number(rateMap[item.metal]) : Number(item.rate || 0),
    }));

    const updatedVariantCombinations = (product.variantCombinations || []).map((combo) => ({
      selections: combo.selections,
      price: calculateVariantPrice(combo, rateMap, globalMakingCharge),
      image: combo.image,
      images: Array.isArray(combo.images) ? combo.images : [combo.image].filter(Boolean),
      quantity: combo.quantity,
      metal: normalizeMetalName(combo.metal),
      weight: Number(combo.weight) || 0,
      rate: rateMap[normalizeMetalName(combo.metal)] !== undefined
        ? Number(rateMap[normalizeMetalName(combo.metal)])
        : Number(combo.rate || 0),
      makingCharge: combo.makingCharge,
    }));

    // const updatedVariantCombinations = (product.variantCombinations || []).map((combo) => {
    //   const comboMakingCharge =
    //     combo?.makingCharge !== undefined &&
    //       combo?.makingCharge !== null
    //       ? Number(combo.makingCharge) || 0
    //       : globalMakingCharge;

    //   return {
    //     selections: combo.selections,
    //     price: calculateVariantPrice(combo, rateMap) + comboMakingCharge,
    //     image: combo.image,
    //     images: Array.isArray(combo.images)
    //       ? combo.images
    //       : [combo.image].filter(Boolean),
    //     quantity: combo.quantity,
    //     metal: normalizeMetalName(combo.metal),
    //     weight: Number(combo.weight) || 0,
    //     rate:
    //       rateMap[normalizeMetalName(combo.metal)] !== undefined
    //         ? Number(rateMap[normalizeMetalName(combo.metal)])
    //         : Number(combo.rate || 0),
    //     makingCharge: combo.makingCharge,
    //   };
    // });

    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          price: newPrice,
          materials: updatedMaterials,
          variantCombinations: updatedVariantCombinations,
        },
      },
    };
  });

  if (operations.length) {
    await Product.bulkWrite(operations);
  }
};

router.get("/", async (req, res) => {
  try {
    const rates = await getSortedRates();
    res.json(rates);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to fetch metal rates");
  }
});

router.put("/", adminAuth, async (req, res) => {
  try {
    const rates = Array.isArray(req.body.rates) ? req.body.rates : [];

    if (!rates.length) {
      return res.status(400).json("Provide an array of rates");
    }

    const validRates = rates
      .map((item) => ({
        ...item,
        metal: normalizeMetalName(item?.metal),
        rate: Number(item?.rate),
      }))
      .filter((item) => item.metal && item.rate > 0);
    const submittedMetals = validRates.map((item) => item.metal);

    await MetalRate.deleteMany({
      metal: { $nin: submittedMetals },
    });

    await Promise.all(validRates.map(async (item) => {
      await MetalRate.findOneAndUpdate(
        { metal: metalRegex(item.metal) },
        {
          metal: item.metal,
          rate: item.rate,
          currency: item.currency || "INR",
          unit: item.unit || "gram",
          source: item.source || "manual",
        },
        { upsert: true, returnDocument: "after" }
      );
    }));

    await refreshAllProductPrices();

    const updatedRates = await getSortedRates();
    res.json(updatedRates);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to update metal rates");
  }
});

router.get("/pricing-settings", async (req, res) => {
  try {
    const setting = await getPricingSetting();
    res.json(setting);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to fetch pricing settings");
  }
});

router.put("/pricing-settings", adminAuth, async (req, res) => {
  try {
    const makingCharge = Number(req.body.makingCharge) || 0;
    const setting = await PricingSetting.findOneAndUpdate(
      { key: "default" },
      { key: "default", makingCharge },
      { upsert: true, returnDocument: "after" }
    );
    await refreshAllProductPrices();

    res.json(setting);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to update pricing settings");
  }
});

router.delete("/:metal", adminAuth, async (req, res) => {
  try {
    await MetalRate.deleteMany({ metal: metalRegex(req.params.metal) });
    await refreshAllProductPrices();
    const updatedRates = await getSortedRates();
    res.json(updatedRates);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to delete metal rate");
  }
});

router.post("/refresh", adminAuth, async (req, res) => {
  try {
    await refreshAllProductPrices();
    res.json("Product prices refreshed");
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to refresh product prices");
  }
});

// Trigger a fetch from external provider and update stored metal rates
router.post("/fetch", adminAuth, async (req, res) => {
  try {
    const fetched = await fetchAndUpdateMetalRates();
    if (!fetched || fetched.error) {
      return res.status(500).json({
        message: fetched?.error || "Failed to fetch metal rates",
      });
    }

    const rates = await getSortedRates();
    res.json({
      rates,
      warnings: fetched.warnings || [],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to fetch and update metal rates");
  }
});

export default router;
