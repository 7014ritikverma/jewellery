import express from "express";
import axios from "axios";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";
import PricingSetting from "../models/PricingSetting.js";
import { rateLimit } from "../middleware/security.js";
import { checkShiprocketServiceability, isShiprocketConfigured } from "../utils/shiprocketService.js";
import {
  calculateCheckoutPricing,
  normalizeSelectedPaymentMethod,
} from "../utils/checkoutPricing.js";

const router = express.Router();

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2023-08-01";
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL
  || (process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg");

const getCashfreeHeaders = () => {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree credentials are not configured");
  }

  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": process.env.CASHFREE_APP_ID,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  };
};

const getGlobalMakingCharge = async () => {
  const setting = await PricingSetting.findOne({ key: "default" });
  return Number(setting?.makingCharge || 0);
};

const calculateMakingCharge = (basePrice = 0, percent = 0) => {
  const price = Number(basePrice) || 0;
  const percentage = Number(percent) || 0;
  return price > 0 && percentage > 0 ? (price * percentage) / 100 : 0;
};

const normalizeOrderVariants = (variants = []) => (
  Array.isArray(variants)
    ? variants.map((variant) => ({
      group: String(variant?.group || "").trim(),
      option: String(variant?.option || "").trim(),
      image: String(variant?.image || "").trim(),
    })).filter((variant) => variant.group && variant.option)
    : []
);

const selectionMatches = (comboSelections = [], itemVariants = []) => {
  if (!comboSelections.length || comboSelections.length !== itemVariants.length) return false;

  return comboSelections.every((selection) =>
    itemVariants.some((variant) =>
      String(variant.group).toLowerCase() === String(selection.group).toLowerCase() &&
      String(variant.option).toLowerCase() === String(selection.option).toLowerCase()
    )
  );
};

const selectionPartiallyMatches = (comboSelections = [], itemVariants = []) => {
  if (!comboSelections.length) return false;

  return comboSelections.every((selection) =>
    itemVariants.some((variant) =>
      String(variant.group).toLowerCase() === String(selection.group).toLowerCase() &&
      String(variant.option).toLowerCase() === String(selection.option).toLowerCase()
    )
  );
};

const resolveItemPrice = (product, itemVariants = [], globalMakingCharge = 0) => {
  const variants = normalizeOrderVariants(itemVariants);
  const combinations = product.variantCombinations || [];
  const exactCombo = combinations.find((candidate) =>
    selectionMatches(candidate.selections || [], variants)
  );
  const partialCombo = combinations
    .filter((candidate) => selectionPartiallyMatches(candidate.selections || [], variants))
    .sort((a, b) => (b.selections?.length || 0) - (a.selections?.length || 0))[0];
  const combo = exactCombo || partialCombo;

  if (combo && Number(combo.price) > 0) {
    const comboMakingCharge = combo.makingCharge !== undefined && combo.makingCharge !== null
      ? Number(combo.makingCharge) || 0
      : Number(globalMakingCharge) || 0;
    const basePrice = Number(combo.price);
    return {
      price: basePrice + calculateMakingCharge(basePrice, comboMakingCharge),
      quantity: Number(combo.quantity) || Number(product.quantity) || 0,
    };
  }

  const selectedOption = variants
    .map((variant) => (product.variantGroups || [])
      .find((group) => String(group.name).toLowerCase() === String(variant.group).toLowerCase())
      ?.options?.find((option) => String(option.label).toLowerCase() === String(variant.option).toLowerCase()))
    .find((option) => option && Number(option.price) > 0);

  return {
    price: Number(selectedOption?.price || product.price) + calculateMakingCharge(Number(selectedOption?.price || product.price), globalMakingCharge),
    quantity: Number(product.quantity) || 0,
  };
};

const calculateItemsTotal = async (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Payment items are required");
  }

  let total = 0;
  const globalMakingCharge = await getGlobalMakingCharge();

  for (const item of items) {
    const qty = Number(item.qty);

    if (!item.product || !Number.isInteger(qty) || qty <= 0) {
      throw new Error("Invalid payment item");
    }

    const product = await Product.findById(item.product).select("price quantity makingCharge variantGroups variantCombinations");

    if (!product || product.quantity < qty) {
      throw new Error("Product is unavailable");
    }

    const productMakingCharge = product.makingCharge !== undefined && product.makingCharge !== null
      ? Number(product.makingCharge) || 0
      : globalMakingCharge;
    const resolvedItem = resolveItemPrice(product, item.variants, productMakingCharge);
    if (resolvedItem.quantity < qty) {
      throw new Error("Selected product variant is unavailable");
    }

    total += resolvedItem.price * qty;
  }

  return total;
};

const buildDeliveryEstimate = ({ days, etd }) => {
  const numericDays = Number.parseInt(days, 10);
  let estimatedDate = null;

  if (etd) {
    const parsed = new Date(etd);
    if (!Number.isNaN(parsed.getTime())) {
      estimatedDate = parsed;
    }
  }

  if (!estimatedDate && Number.isFinite(numericDays) && numericDays > 0) {
    estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + numericDays);
  }

  const estimatedDeliveryDate = estimatedDate ? estimatedDate.toISOString() : null;
  const estimatedDeliveryText = estimatedDate
    ? estimatedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : (etd ? String(etd) : "");

  return {
    estimatedDeliveryDate,
    estimatedDeliveryText,
    days: Number.isFinite(numericDays) && numericDays > 0 ? numericDays : null,
  };
};

// CREATE CASHFREE PAYMENT SESSION
router.post(
  "/create-order",
  auth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "payment-create" }),
  async (req, res) => {
    try {
      const amount = await calculateItemsTotal(req.body.items);
      const selectedPaymentMethod = normalizeSelectedPaymentMethod(
        req.body.selectedPaymentMethod
      );

      if (!["UPI", "CARD", "WALLET"].includes(selectedPaymentMethod)) {
        return res.status(400).json({ error: "Select UPI, Card or Wallet for online payment." });
      }

      const pricing = calculateCheckoutPricing(amount, selectedPaymentMethod);
      const orderAmount = pricing.finalPayableAmount;

      if (!orderAmount || orderAmount <= 0) {
        return res.status(400).json({ error: "Invalid payment amount." });
      }

      const customer = req.body.customer || {};
      const customerPhone = String(customer.phone || "").replace(/\D/g, "").slice(-10);

      if (!/^[6-9]\d{9}$/.test(customerPhone)) {
        return res.status(400).json({ error: "Valid customer phone number is required." });
      }

      const cashfreeOrderId = `cf_${req.user.id}_${Date.now()}`;
      const returnUrl = req.body.returnUrl
        || `${req.protocol}://${req.get("host")}/api/payment/cashfree-return?order_id={order_id}`;
      const cashfreePaymentMethods = {
        UPI: "upi",
        CARD: "cc,dc",
        WALLET: "wallet",
      };

      const { data: order } = await axios.post(`${CASHFREE_BASE_URL}/orders`, {
        order_id: cashfreeOrderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(req.user.id),
          customer_name: String(customer.name || "Customer").trim() || "Customer",
          customer_email: String(customer.email || `customer-${req.user.id}@example.com`).trim(),
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: returnUrl,
          payment_methods: cashfreePaymentMethods[selectedPaymentMethod],
        },
        order_note: "Shree Sarraf Jewellers order",
        order_tags: {
          selected_payment_method: selectedPaymentMethod,
          original_amount: String(pricing.originalAmount),
          discount_amount: String(pricing.discountAmount),
          shipping_charge: String(pricing.shippingCharge),
        },
      }, {
        headers: getCashfreeHeaders(),
      });

      res.json({
        orderId: order.order_id,
        paymentSessionId: order.payment_session_id,
        orderAmount,
        ...pricing,
        environment: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox",
      });
    } catch (err) {
      console.error("Cashfree create-order error:", err.response?.data || err.message);

      res.status(400).json({
        error: err.response?.data?.message || err.message || "Payment order creation failed.",
      });
    }
  }
);

router.get(
  "/check-pincode/:pincode",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: "pincode-check" }),
  async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: "Invalid pincode" });
    }

    if (isShiprocketConfigured() && process.env.SHIPROCKET_PICKUP_PINCODE) {
      const serviceability = await checkShiprocketServiceability({
        pickupPostcode: process.env.SHIPROCKET_PICKUP_PINCODE,
        deliveryPostcode: pincode,
        cod: req.query.cod === "1" || req.query.cod === "true",
        weight: req.query.weight || process.env.SHIPROCKET_DEFAULT_WEIGHT_KG,
      });

      const fastestCourier = serviceability.couriers
        .filter((item) => item?.etd)
        .sort((a, b) => String(a.etd).localeCompare(String(b.etd)))[0];
      const estimate = buildDeliveryEstimate({
        days: fastestCourier?.estimated_delivery_days,
        etd: fastestCourier?.etd,
      });

      return res.json({
        available: serviceability.available,
        estimateSource: "shiprocket",
        city: fastestCourier?.city || "",
        state: fastestCourier?.state || "",
        days: estimate.days,
        estimatedDeliveryDate: estimate.estimatedDeliveryDate,
        estimatedDeliveryText: estimate.estimatedDeliveryText,
        couriers: serviceability.couriers.map((item) => ({
          courierCompanyId: item.courier_company_id,
          courierName: item.courier_name,
          rate: item.rate,
          etd: item.etd,
        })),
      });
    }

    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { timeout: 5000 }
    );

    const data = response.data[0];

    if (data.Status !== "Success") {
      return res.json({ available: false });
    }

    const postOffice = data.PostOffice[0];

    res.json({
      available: true,
      city: postOffice.District,
      state: postOffice.State,
      days: null,
      estimatedDeliveryDate: null,
      estimatedDeliveryText: "",
      estimateSource: "postal",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to check pincode" });
  }
  }
);

export default router;
