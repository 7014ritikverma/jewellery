import MetalRate from "../models/MetalRate.js";
import Product from "../models/Product.js";

const TROY_OUNCE_GRAMS = 31.1034768;
const DEFAULT_MAP = { Gold: "XAU", Silver: "XAG" };

const readMetalMap = () => {
  if (!process.env.METAL_RATE_MAP) return DEFAULT_MAP;

  try {
    return JSON.parse(process.env.METAL_RATE_MAP);
  } catch (e) {
    console.warn("Invalid METAL_RATE_MAP JSON, falling back to default map");
    return DEFAULT_MAP;
  }
};

const readAdjustmentMap = () => {
  if (!process.env.METAL_RATE_ADJUSTMENT_MAP) return {};

  try {
    return JSON.parse(process.env.METAL_RATE_ADJUSTMENT_MAP);
  } catch (e) {
    console.warn("Invalid METAL_RATE_ADJUSTMENT_MAP JSON, using raw provider rates");
    return {};
  }
};

const applyLocalAdjustments = (rates, adjustmentMap) => {
  return rates.map((item) => {
    const adjustmentFactor = Number(adjustmentMap[item.metal] ?? 1);
    const safeFactor = Number.isFinite(adjustmentFactor) && adjustmentFactor > 0
      ? adjustmentFactor
      : 1;

    return {
      ...item,
      rawRate: item.rate,
      adjustmentFactor: safeFactor,
      rate: Number((item.rate * safeFactor).toFixed(2)),
    };
  });
};

const getProviderError = async (res) => {
  const body = await res.text().catch(() => "");

  if (!body) return `${res.status} ${res.statusText}`.trim();

  try {
    const json = JSON.parse(body);
    return json.error?.info || json.message || body;
  } catch (e) {
    return body;
  }
};

const buildRatesFromUsdBase = ({ json, map, currency }) => {
  const currencyRate = currency === "USD" ? 1 : Number(json.rates?.[currency]);
  if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
    throw new Error(`Metal provider did not return a valid ${currency} currency rate`);
  }

  return Object.entries(map).map(([metal, symbol]) => {
    const metalRate = Number(json.rates?.[symbol]);
    if (!Number.isFinite(metalRate) || metalRate <= 0) {
      throw new Error(`Metal provider did not return a valid ${symbol} rate for ${metal}`);
    }

    const perTroyOunce = currencyRate / metalRate;
    return {
      metal,
      providerSymbol: symbol,
      rate: Number((perTroyOunce / TROY_OUNCE_GRAMS).toFixed(2)),
    };
  });
};

const fetchMetalsApiRates = async ({ apiKey, map, currency }) => {
  const endpoint = process.env.METAL_RATE_API_URL || "https://api.metals-api.com/api/latest";
  const symbols = Array.from(new Set([...Object.values(map), currency])).join(",");
  const url = new URL(endpoint);
  url.searchParams.set("access_key", apiKey);
  url.searchParams.set("symbols", symbols);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Metals-API request failed: ${await getProviderError(res)}`);
  }

  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error?.info || "Metals-API returned an error");
  }

  return buildRatesFromUsdBase({ json, map, currency });
};

const fetchMetalPriceApiRates = async ({ apiKey, map, currency }) => {
  const endpoint = process.env.METAL_RATE_API_URL || "https://api.metalpriceapi.com/v1/latest";
  const currencies = Array.from(new Set([...Object.values(map), currency])).join(",");
  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("base", "USD");
  url.searchParams.set("currencies", currencies);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MetalpriceAPI request failed: ${await getProviderError(res)}`);
  }

  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error?.info || json.error?.message || "MetalpriceAPI returned an error");
  }

  return buildRatesFromUsdBase({ json, map, currency });
};

const refreshProductsFromStoredRates = async () => {
  const rates = await MetalRate.find();
  const rateLookup = rates.reduce((map, item) => ({
    ...map,
    [item.metal]: Number(item.rate),
  }), {});

  const products = await Product.find({ "materials.0": { $exists: true } });
  const ops = products.map((product) => {
    const newPrice = (product.materials || []).reduce((sum, item) => {
      const weight = Number(item.weight) || 0;
      const rate = rateLookup[item.metal];
      if (!item.metal || !weight || rate === undefined) return sum;
      return sum + weight * Number(rate);
    }, 0);

    const updatedMaterials = (product.materials || []).map((item) => ({
      metal: item.metal,
      weight: Number(item.weight) || 0,
      rate: rateLookup[item.metal] !== undefined ? Number(rateLookup[item.metal]) : Number(item.rate || 0),
    }));

    return {
      updateOne: {
        filter: { _id: product._id },
        update: { price: newPrice, materials: updatedMaterials },
      },
    };
  });

  if (ops.length) await Product.bulkWrite(ops);
};

export const fetchAndUpdateMetalRates = async () => {
  try {
    const provider = (process.env.METAL_RATE_PROVIDER || "metalsapi").toLowerCase();
    const apiKey = process.env.METAL_RATE_API_KEY;
    const currency = process.env.METAL_RATE_CURRENCY || "INR";
    const map = readMetalMap();
    const adjustmentMap = readAdjustmentMap();

    if (!apiKey && ["metalsapi", "metalpriceapi"].includes(provider)) {
      throw new Error("METAL_RATE_API_KEY is not configured in server/.env");
    }

    if (!["metalsapi", "metalpriceapi"].includes(provider)) {
      throw new Error(`Unsupported metal rate provider: ${provider}`);
    }

    const rawFetchedRates = provider === "metalpriceapi"
      ? await fetchMetalPriceApiRates({ apiKey, map, currency })
      : await fetchMetalsApiRates({ apiKey, map, currency });
    const fetchedRates = applyLocalAdjustments(rawFetchedRates, adjustmentMap);

    const fetchedAt = new Date();
    await Promise.all(
      fetchedRates.map(({ metal, providerSymbol, rate, rawRate, adjustmentFactor }) =>
        MetalRate.findOneAndUpdate(
          { metal },
          {
            rate,
            rawRate,
            adjustmentFactor,
            currency,
            unit: "gram",
            source: provider,
            providerSymbol,
            lastFetchedAt: fetchedAt,
          },
          { upsert: true, returnDocument: "after" }
        )
      )
    );

    await refreshProductsFromStoredRates();
    return {
      rates: fetchedRates.reduce((map, item) => ({ ...map, [item.metal]: item.rate }), {}),
      warnings: [],
    };
  } catch (err) {
    console.log("fetchAndUpdateMetalRates failed", err);
    return {
      error: err.message || "Failed to fetch metal rates",
    };
  }
};

export default fetchAndUpdateMetalRates;
