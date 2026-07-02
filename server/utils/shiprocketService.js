import axios from "axios";

const DEFAULT_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const getBaseUrl = () => (process.env.SHIPROCKET_API_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

export const isShiprocketConfigured = () => {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
};

const getShiprocketToken = async () => {
  if (!isShiprocketConfigured()) {
    throw new Error("Shiprocket credentials are not configured");
  }

  if (cachedToken && Date.now() < cachedTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken;
  }

  let data;

  try {
    const response = await axios.post(
      `${getBaseUrl()}/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      { timeout: 15000 }
    );

    data = response.data;
  } catch (err) {
    const message = err.response?.data?.message || err.message || "Shiprocket login failed";
    const status = err.response?.status ? ` (${err.response.status})` : "";

    throw new Error(
      `Shiprocket login failed${status}: ${message}. Check Shiprocket API user email/password and API access.`
    );
  }

  if (!data?.token) {
    throw new Error(data?.message || "Shiprocket login did not return a token");
  }

  cachedToken = data.token;
  cachedTokenExpiresAt = Date.now() + 9 * 60 * 60 * 1000;
  return cachedToken;
};

const shiprocketRequest = async ({ method = "GET", path, params, data }) => {
  const token = await getShiprocketToken();

  try {
    const response = await axios({
      method,
      url: `${getBaseUrl()}${path}`,
      params,
      data,
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (err) {
    const message = err.response?.data?.message
      || err.response?.data?.error
      || err.response?.data?.errors
      || err.message
      || "Shiprocket request failed";

    const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
    error.response = err.response?.data;
    throw error;
  }
};

export const testShiprocketConnection = async () => {
  const token = await getShiprocketToken();

  return {
    connected: true,
    tokenReceived: Boolean(token),
    apiUrl: getBaseUrl(),
  };
};

export const getShiprocketPickupLocations = async () => {
  const payload = await shiprocketRequest({
    path: "/settings/company/pickup",
  });

  const locations = payload?.data?.shipping_address
    || payload?.data
    || payload?.shipping_address
    || [];

  return {
    locations: Array.isArray(locations) ? locations : [],
    raw: payload,
  };
};

export const checkShiprocketServiceability = async ({
  pickupPostcode,
  deliveryPostcode,
  cod = false,
  weight,
}) => {
  const payload = await shiprocketRequest({
    path: "/courier/serviceability/",
    params: {
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      cod: cod ? 1 : 0,
      weight: Number(weight || process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
    },
  });

  const couriers = payload?.data?.available_courier_companies || [];

  return {
    available: couriers.length > 0,
    couriers,
    raw: payload,
  };
};

const splitName = (name = "Customer") => {
  const parts = String(name || "Customer").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "Customer",
  };
};

const toPhone = (value = "") => String(value).replace(/\D/g, "").slice(-10);

const buildOrderItems = (order) => {
  return (order.items || []).map((item) => {
    const product = item.product || {};
    const units = Number(item.qty) || 1;
    const sellingPrice = Number(item.itemPrice || product.price || 0);

    return {
      name: product.name || "Jewellery Item",
      sku: String(product._id || item.product || item._id),
      units,
      selling_price: sellingPrice,
      discount: 0,
      tax: 0,
      hsn: Number(process.env.SHIPROCKET_DEFAULT_HSN || 7113),
    };
  });
};

export const createShiprocketOrder = async (order) => {
  const shipping = order.shippingAddress || {};
  const user = order.user || {};
  const customerName = shipping.name || user.name || "Customer";
  const { firstName, lastName } = splitName(customerName);
  const phone = toPhone(shipping.phone || order.deliveryMobile || user.mobile || user.phone);
  const pincode = String(shipping.pincode || "").trim();

  if (!phone || phone.length !== 10) {
    throw new Error("Valid 10 digit customer mobile number is required for Shiprocket");
  }

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error("Valid 6 digit delivery pincode is required for Shiprocket");
  }

  if (!process.env.SHIPROCKET_PICKUP_LOCATION) {
    throw new Error("SHIPROCKET_PICKUP_LOCATION is not configured");
  }

  const orderItems = buildOrderItems(order);
  const subTotal = Number(order.total || 0);
  const isCod = order.paymentMethod === "COD";
  const paymentMethod = isCod ? "COD" : "Prepaid";

  const payload = {
    order_id: `SSJ-${order._id}-${Date.now()}`,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 19).replace("T", " "),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: shipping.addressLine1 || shipping.address || order.address || "Address",
    billing_address_2: [shipping.addressLine2, shipping.landmark].filter(Boolean).join(", "),
    billing_city: shipping.city || process.env.SHIPROCKET_DEFAULT_CITY || "Jaipur",
    billing_pincode: Number(pincode),
    billing_state: shipping.state || process.env.SHIPROCKET_DEFAULT_STATE || "Rajasthan",
    billing_country: shipping.country || "India",
    billing_email: user.email || process.env.SHIPROCKET_FALLBACK_EMAIL || "customer@example.com",
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: paymentMethod,
    cod: isCod ? 1 : 0,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: subTotal,
    length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 10),
    breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 10),
    height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 5),
    weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
  };

  return shiprocketRequest({
    method: "POST",
    path: "/orders/create/adhoc",
    data: payload,
  });
};

export const assignShiprocketAwb = async ({ shipmentId, courierId }) => {
  if (!shipmentId) throw new Error("Shipment id is required");

  return shiprocketRequest({
    method: "POST",
    path: "/courier/assign/awb",
    data: {
      shipment_id: shipmentId,
      courier_id: courierId ? Number(courierId) : undefined,
    },
  });
};

export const generateShiprocketPickup = async (shipmentId) => {
  if (!shipmentId) throw new Error("Shipment id is required");

  return shiprocketRequest({
    method: "POST",
    path: "/courier/generate/pickup",
    data: {
      shipment_id: [Number(shipmentId)],
    },
  });
};

export const generateShiprocketLabel = async (shipmentId) => {
  if (!shipmentId) throw new Error("Shipment id is required");

  return shiprocketRequest({
    method: "POST",
    path: "/courier/generate/label",
    data: {
      shipment_id: [Number(shipmentId)],
    },
  });
};

export const getShiprocketTracking = async (awbCode) => {
  if (!awbCode) throw new Error("AWB code is required");

  return shiprocketRequest({
    path: `/courier/track/awb/${encodeURIComponent(awbCode)}`,
  });
};
