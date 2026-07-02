import axios from "axios";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

const normalizeMobile = (mobile = "") => {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(-10);
};

const isConfigured = () => {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
};

const getGraphUrl = () => {
  const version = process.env.WHATSAPP_API_VERSION || "v25.0";
  return `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
};

export const sendWhatsAppText = async ({ to, body }) => {
  if (!isConfigured()) {
    console.log(`WhatsApp skipped for ${to}: Cloud API config missing`);
    return;
  }

  try {
    await axios.post(
      getGraphUrl(),
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    console.log("WhatsApp send failed:", err.response?.data || err.message);
    throw err;
  }
};

const findUserByWhatsAppNumber = async (whatsappNumber) => {
  const mobile = normalizeMobile(whatsappNumber);

  if (!mobile) return null;

  return User.findOne({
    $or: [
      { mobile },
      { phone: mobile },
      { mobile: `91${mobile}` },
      { phone: `91${mobile}` },
    ],
  });
};

const formatPrice = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
};

const getOrderSummary = (order) => {
  const items = (order.items || [])
    .map((item) => `${item.product?.name || "Product"} x ${item.qty}`)
    .join(", ");

  return [
    `Order: ${order._id}`,
    `Status: ${order.status}`,
    `Payment: ${order.paymentMethod || "COD"} (${order.paymentStatus || "Pending"})`,
    `Total: ${formatPrice(order.total)}`,
    items ? `Items: ${items}` : "",
  ].filter(Boolean).join("\n");
};

const getRecentOrdersReply = async (user) => {
  const orders = await Order.find({ user: user._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(3)
    .populate("items.product");

  if (!orders.length) {
    return "No orders found for your mobile number.";
  }

  return `Your recent orders:\n\n${orders.map(getOrderSummary).join("\n\n")}`;
};

const getSpecificOrderReply = async ({ user, orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return "Invalid order ID. Send: order <order id>";
  }

  const order = await Order.findOne({ _id: orderId, user: user._id })
    .populate("items.product");

  if (!order) {
    return "Order not found for your mobile number.";
  }

  return getOrderSummary(order);
};

const getMenuReply = () => {
  const brand = process.env.OTP_BRAND_NAME || "Jewellery Store";

  return [
    `Hi, welcome to ${brand}.`,
    "",
    "Send one of these:",
    "1. orders - View recent orders",
    "2. order <order id> - Track one order",
    "3. support - Contact support",
  ].join("\n");
};

const getSupportReply = () => {
  const supportMobile = process.env.WHATSAPP_SUPPORT_NUMBER || process.env.ADMIN_OTP_MOBILE || "";

  return supportMobile
    ? `Our support team will help you. Contact: +91${normalizeMobile(supportMobile)}`
    : "Our support team will contact you soon.";
};

export const getWhatsAppBotReply = async ({ from, text }) => {
  const message = String(text || "").trim();
  const lower = message.toLowerCase();

  if (!message || ["hi", "hello", "hey", "menu", "help"].includes(lower)) {
    return getMenuReply();
  }

  if (lower === "support" || lower === "contact") {
    return getSupportReply();
  }

  const user = await findUserByWhatsAppNumber(from);

  if (!user) {
    return "Account not found for this WhatsApp number. Please signup on the website first.";
  }

  if (["orders", "my orders", "order status", "track"].includes(lower)) {
    return getRecentOrdersReply(user);
  }

  if (lower.startsWith("order ")) {
    const orderId = message.split(/\s+/)[1];
    return getSpecificOrderReply({ user, orderId });
  }

  return "I did not understand that. Send 'menu' to see options.";
};

export const getWebsiteBotReply = async ({ userId, text }) => {
  const message = String(text || "").trim();
  const lower = message.toLowerCase();

  if (!message || ["hi", "hello", "hey", "menu", "help"].includes(lower)) {
    return getMenuReply();
  }

  if (lower === "support" || lower === "contact") {
    return getSupportReply();
  }

  if (["orders", "my orders", "order status", "track"].includes(lower) || lower.startsWith("order ")) {
    if (!userId) {
      return "Please login first to check your orders.";
    }

    const user = await User.findById(userId);

    if (!user) {
      return "Account not found. Please login again.";
    }

    if (lower.startsWith("order ")) {
      const orderId = message.split(/\s+/)[1];
      return getSpecificOrderReply({ user, orderId });
    }

    return getRecentOrdersReply(user);
  }

  return "I did not understand that. Send 'menu' to see options.";
};
