import express from "express";
import axios from "axios";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
import { rateLimit } from "../middleware/security.js";
import { adminAuth } from "../middleware/auth.js";
import Product from "../models/Product.js";
import PricingSetting from "../models/PricingSetting.js";
import { sendOrderPlacedEmails } from "../utils/emailService.js";
import {
    calculateCheckoutPricing,
    normalizeSelectedPaymentMethod,
} from "../utils/checkoutPricing.js";
import {
    assignShiprocketAwb,
    checkShiprocketServiceability,
    createShiprocketOrder,
    generateShiprocketLabel,
    generateShiprocketPickup,
    getShiprocketPickupLocations,
    getShiprocketTracking,
    testShiprocketConnection,
} from "../utils/shiprocketService.js";

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

const getTrackingData = (payload = {}) => payload.tracking_data || payload.data || payload;

const normalizeTrackingEvents = (payload = {}) => {
    const data = getTrackingData(payload);
    const activities = data?.shipment_track_activities
        || data?.track_activities
        || data?.tracking_history
        || data?.events
        || [];

    return (Array.isArray(activities) ? activities : []).map((item) => ({
        status: item.status || item.current_status || item.activity || "",
        location: item.location || item.city || item.scan_location || "",
        date: item.date || item.datetime || item.activity_date || item.scan_date || "",
        activity: item.activity || item.remark || item.status || "",
    }));
};

const getTrackingStatus = (payload = {}) => {
    const data = getTrackingData(payload);
    const firstTrack = Array.isArray(data?.shipment_track) ? data.shipment_track[0] : null;

    return data?.current_status
        || data?.shipment_status
        || firstTrack?.current_status
        || firstTrack?.shipment_status
        || firstTrack?.status
        || "";
};

const mapTrackingStatusToOrderStatus = (status = "") => {
    const value = String(status).toLowerCase();

    if (value.includes("out for delivery") || value.includes("ofd")) return "Out for Delivery";
    if (value.includes("deliver")) return "Delivered";
    if (value.includes("pickup") || value.includes("manifest") || value.includes("assign")) return "Processing";
    if (value.includes("ship") || value.includes("transit") || value.includes("ofd") || value.includes("out for delivery")) return "Shipped";

    return null;
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

    return {
        estimatedDeliveryDate: estimatedDate || null,
        estimatedDeliveryText: estimatedDate
            ? estimatedDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
            : "",
    };
};

const getRealDeliveryEstimate = async ({ pincode, cod }) => {
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD || !process.env.SHIPROCKET_PICKUP_PINCODE) {
        return { estimatedDeliveryDate: null, estimatedDeliveryText: "" };
    }

    const serviceability = await checkShiprocketServiceability({
        pickupPostcode: process.env.SHIPROCKET_PICKUP_PINCODE,
        deliveryPostcode: pincode,
        cod,
        weight: process.env.SHIPROCKET_DEFAULT_WEIGHT_KG,
    });

    const fastestCourier = serviceability.couriers
        .filter((item) => item?.etd || item?.estimated_delivery_days)
        .sort((a, b) => {
            const aDate = a.etd ? new Date(a.etd).getTime() : Number.MAX_SAFE_INTEGER;
            const bDate = b.etd ? new Date(b.etd).getTime() : Number.MAX_SAFE_INTEGER;
            const aDays = Number.parseInt(a.estimated_delivery_days, 10) || Number.MAX_SAFE_INTEGER;
            const bDays = Number.parseInt(b.estimated_delivery_days, 10) || Number.MAX_SAFE_INTEGER;
            return (Number.isNaN(aDate) ? aDays : aDate) - (Number.isNaN(bDate) ? bDays : bDate);
        })[0];

    return buildDeliveryEstimate({
        days: fastestCourier?.estimated_delivery_days,
        etd: fastestCourier?.etd,
    });
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

const resolveOrderVariant = (product, itemVariants = [], globalMakingCharge = 0) => {
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
        const comboImages = Array.isArray(combo.images) && combo.images.length
            ? combo.images
            : [combo.image].filter(Boolean);
        return {
            variants,
            price: basePrice + calculateMakingCharge(basePrice, comboMakingCharge),
            image: comboImages[0] || variants.find((variant) => variant.image)?.image || product.images?.[0] || "",
            quantity: Number(combo.quantity) || Number(product.quantity) || 0,
            variantCombinationId: combo._id,
        };
    }

    const selectedOption = variants
        .map((variant) => (product.variantGroups || [])
            .find((group) => String(group.name).toLowerCase() === String(variant.group).toLowerCase())
            ?.options?.find((option) => String(option.label).toLowerCase() === String(variant.option).toLowerCase()))
        .find((option) => option && Number(option.price) > 0);

    return {
        variants,
        price: Number(selectedOption?.price || product.price) + calculateMakingCharge(Number(selectedOption?.price || product.price), globalMakingCharge),
        image: selectedOption?.image || variants.find((variant) => variant.image)?.image || product.images?.[0] || "",
        quantity: Number(product.quantity) || 0,
        variantCombinationId: null,
    };
};

const syncShiprocketTracking = async (order) => {
    if (!order?.shiprocket?.awbCode) {
        throw new Error("AWB not generated yet");
    }

    const result = await getShiprocketTracking(order.shiprocket.awbCode);
    const currentStatus = getTrackingStatus(result);
    const mappedStatus = mapTrackingStatusToOrderStatus(currentStatus);
    const trackingEvents = normalizeTrackingEvents(result);

    const update = {
        "shiprocket.status": currentStatus || order.shiprocket.status || "Tracking Synced",
        "shiprocket.trackingEvents": trackingEvents,
        "shiprocket.lastResponse": result,
        "shiprocket.lastTrackedAt": new Date(),
        "shiprocket.updatedAt": new Date(),
    };

    if (mappedStatus) {
        update.status = mappedStatus;
    }

    return Order.findByIdAndUpdate(order._id, update, { returnDocument: "after" })
        .populate("user", "name email mobile phone")
        .populate("items.product");
};

const createRealShipmentForOrder = async (orderId) => {
    const order = await Order.findById(orderId)
        .populate("user", "name email mobile phone")
        .populate("items.product");

    if (!order || order.shiprocket?.shipmentId) return order;

    try {
        if (process.env.SHIPROCKET_PICKUP_PINCODE && order.shippingAddress?.pincode) {
            const serviceability = await checkShiprocketServiceability({
                pickupPostcode: process.env.SHIPROCKET_PICKUP_PINCODE,
                deliveryPostcode: order.shippingAddress.pincode,
                cod: order.paymentMethod === "COD",
                weight: process.env.SHIPROCKET_DEFAULT_WEIGHT_KG,
            });

            if (!serviceability.available) {
                throw new Error(
                    order.paymentMethod === "COD"
                        ? "No COD-enabled Shiprocket courier is available for this pincode"
                        : "No Shiprocket courier is available for this pincode"
                );
            }
        }

        const result = await createShiprocketOrder(order);

        return Order.findByIdAndUpdate(
            order._id,
            {
                status: "Processing",
                shiprocket: {
                    orderId: result.order_id,
                    shipmentId: result.shipment_id,
                    status: result.status || "Created",
                    lastResponse: result,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            { returnDocument: "after" }
        )
            .populate("user", "name email mobile phone")
            .populate("items.product");
    } catch (err) {
        await Order.findByIdAndUpdate(order._id, {
            "shiprocket.lastError": err.message || "Shiprocket order creation failed",
            "shiprocket.updatedAt": new Date(),
        });

        throw err;
    }
};

// CREATE ORDER
router.post("/", auth, rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "order-create" }), async (req, res) => {
    try {
        const {
            items,
            address,
            shippingAddress,
            deliveryMobile,
            estimatedDeliveryDate,
            estimatedDeliveryText,
            paymentMethod,
            selectedPaymentMethod,
            paymentStatus,
            cashfreeOrderId,
            cashfreePaymentSessionId,
        } = req.body;

        if (!items?.length || items.some((item) => !item.product || !item.qty)) {
            return res.status(400).json("Order item missing");
        }

        const addressLine1 = String(shippingAddress?.addressLine1 || shippingAddress?.address || address || "").trim();
        const addressLine2 = String(shippingAddress?.addressLine2 || "").trim();
        const landmark = String(shippingAddress?.landmark || "").trim();
        const trimmedAddress = String(address || [addressLine1, addressLine2, landmark].filter(Boolean).join(", ")).trim();
        const deliveryPhone = String(deliveryMobile || shippingAddress?.phone || "").replace(/\D/g, "").slice(-10);
        const deliveryPincode = String(shippingAddress?.pincode || trimmedAddress.match(/\b\d{6}\b/)?.[0] || "").trim();

        if (!trimmedAddress) {
            return res.status(400).json("Delivery address is required");
        }

        if (!/^[6-9]\d{9}$/.test(deliveryPhone)) {
            return res.status(400).json("Valid delivery mobile number is required");
        }

        if (!/^\d{6}$/.test(deliveryPincode)) {
            return res.status(400).json("Valid 6 digit delivery pincode is required");
        }

        let serverTotal = 0;
        const orderItems = [];
        const globalMakingCharge = await getGlobalMakingCharge();

        // Check stock availability
        for (const item of items) {
            const qty = Number(item.qty);
            const product = await Product.findById(item.product);
            if (!product || !Number.isInteger(qty) || qty <= 0 || product.quantity < qty) {
                return res.status(400).json(`Insufficient stock for ${product?.name || 'product'}`);
            }

            const productMakingCharge = product.makingCharge !== undefined && product.makingCharge !== null
                ? Number(product.makingCharge) || 0
                : globalMakingCharge;
            const resolvedVariant = resolveOrderVariant(product, item.variants, productMakingCharge);
            if (resolvedVariant.quantity < qty) {
                return res.status(400).json(`Insufficient stock for selected variant of ${product.name}`);
            }
            serverTotal += resolvedVariant.price * qty;
            orderItems.push({
                product: item.product,
                qty,
                itemPrice: resolvedVariant.price,
                itemImage: resolvedVariant.image,
                variants: resolvedVariant.variants,
                variantCombinationId: resolvedVariant.variantCombinationId,
            });
        }

        const normalizedPaymentMethod = paymentMethod === "ONLINE"
            ? normalizeSelectedPaymentMethod(selectedPaymentMethod)
            : "COD";

        if (
            (paymentMethod === "ONLINE" && !["UPI", "CARD", "WALLET"].includes(normalizedPaymentMethod)) ||
            (paymentMethod !== "ONLINE" && normalizedPaymentMethod !== "COD")
        ) {
            return res.status(400).json("Invalid selected payment method");
        }

        const pricing = calculateCheckoutPricing(serverTotal, normalizedPaymentMethod);
        let cashfreeOrderStatus = "";

        if (paymentMethod === "ONLINE") {
            if (paymentStatus !== "Paid" || !cashfreeOrderId) {
                return res.status(400).json("Verified payment details are required");
            }

            const usedPayment = await Order.exists({ cashfreeOrderId });

            if (usedPayment) {
                return res.status(400).json("Payment already used");
            }

            const { data: cashfreeOrder } = await axios.get(
                `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(cashfreeOrderId)}`,
                { headers: getCashfreeHeaders() }
            );

            cashfreeOrderStatus = String(cashfreeOrder.order_status || "");
            const expectedAmount = pricing.finalPayableAmount;
            const paidAmount = Number(cashfreeOrder.order_amount);

            if (
                Math.abs(paidAmount - expectedAmount) > 0.01 ||
                cashfreeOrderStatus !== "PAID"
            ) {
                return res.status(400).json("Payment amount verification failed");
            }
        }

        let realDeliveryEstimate = {
            estimatedDeliveryDate: null,
            estimatedDeliveryText: "",
        };

        try {
            realDeliveryEstimate = await getRealDeliveryEstimate({
                pincode: deliveryPincode,
                cod: paymentMethod !== "ONLINE",
            });
        } catch (estimateError) {
            console.log("Real delivery estimate failed:", estimateError.message);
        }

        const order = new Order({
            user: req.user.id,
            items: orderItems,
            total: pricing.finalPayableAmount,
            originalAmount: pricing.originalAmount,
            shippingCharge: pricing.shippingCharge,
            discountAmount: pricing.discountAmount,
            finalPayableAmount: pricing.finalPayableAmount,
            selectedPaymentMethod: pricing.selectedPaymentMethod,
            address: trimmedAddress,
            deliveryMobile: deliveryPhone,
            estimatedDeliveryDate: realDeliveryEstimate.estimatedDeliveryDate || undefined,
            estimatedDeliveryText: realDeliveryEstimate.estimatedDeliveryText || "",
            shippingAddress: {
                name: String(shippingAddress?.name || "").trim(),
                phone: deliveryPhone,
                address: trimmedAddress,
                addressLine1,
                addressLine2,
                landmark,
                city: String(shippingAddress?.city || "").trim(),
                state: String(shippingAddress?.state || "").trim(),
                pincode: deliveryPincode,
                country: "India",
            },
            paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
            paymentStatus: paymentMethod === "ONLINE" ? "Paid" : "Pending",
            cashfreeOrderId,
            cashfreePaymentSessionId,
            cashfreeOrderStatus,
        });

        await order.save();
        for (const item of orderItems) {

            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: { sold: item.qty, quantity: -item.qty }
                }
            );

            if (item.variantCombinationId) {
                await Product.updateOne(
                    {
                        _id: item.product,
                        "variantCombinations._id": item.variantCombinationId,
                        "variantCombinations.quantity": { $gt: 0 },
                    },
                    { $inc: { "variantCombinations.$.quantity": -item.qty } }
                );
            }
        }

        let populatedOrder = await Order.findById(order._id)
            .populate("user", "name email mobile phone")
            .populate("items.product");

        sendOrderPlacedEmails(populatedOrder).catch((error) => {
            console.log("Order email notification failed:", error.message);
        });

        res.json(populatedOrder);

    } catch (err) {
        console.error("Create order error:", err);
        res.status(500).json({ message: err.message || "Order create failed" });
    }
});

// GET USER ORDERS
router.get("/my-orders", auth, async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .populate("items.product");

    res.json(orders);
});

router.post("/:id/return-request", auth, async (req, res) => {
    try {
        const reason = String(req.body?.reason || "").trim();

        if (reason.length < 10) {
            return res.status(400).json("Please enter a return reason with at least 10 characters");
        }

        const order = await Order.findOne({ _id: req.params.id, user: req.user.id });

        if (!order) {
            return res.status(404).json("Order not found");
        }

        if (order.status !== "Delivered") {
            return res.status(400).json("Return can be requested only after delivery");
        }

        if (order.returnRequest?.status && order.returnRequest.status !== "None") {
            return res.status(400).json("Return request already exists for this order");
        }

        order.returnRequest = {
            status: "Requested",
            reason,
            requestedAt: new Date(),
            updatedAt: new Date(),
        };

        await order.save();
        await order.populate("items.product");

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json("Return request failed");
    }
});

// GET ALL ORDERS (ADMIN)
router.get("/all", adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1, _id: -1 })
            .populate("user", "name email")
            .populate("items.product");

        res.json(orders);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/shiprocket/setup", adminAuth, async (req, res) => {
    try {
        const connection = await testShiprocketConnection();
        const pickupLocations = await getShiprocketPickupLocations();
        const configuredPickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "";
        const configuredPickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "";
        const locations = pickupLocations.locations.map((item) => ({
            id: item.id || item._id,
            pickupLocation: item.pickup_location || item.pickupLocation || item.name || item.address_type || "",
            address: item.address || item.address_1 || "",
            city: item.city || "",
            state: item.state || "",
            pincode: item.pin_code || item.pincode || item.postcode || "",
        }));
        const matchedPickup = locations.find((item) =>
            String(item.pickupLocation).toLowerCase() === String(configuredPickupLocation).toLowerCase()
        );

        res.json({
            connected: connection.connected,
            apiUrl: connection.apiUrl,
            configuredPickupLocation,
            configuredPickupPincode,
            pickupLocationMatched: Boolean(matchedPickup),
            locations,
        });
    } catch (err) {
        console.log("Shiprocket setup check failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket setup check failed" });
    }
});

router.get("/:id", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("items.product");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (String(order.user) !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(order);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
});

router.put("/:id/status", adminAuth, async (req, res) => {
    try {
        const allowedStatuses = ["Placed", "Out for Delivery", "Delivered"];
        const status = String(req.body?.status || "").trim();
        const note = String(req.body?.note || "").trim().slice(0, 300);

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Only Placed, Out for Delivery, and Delivered can be set manually" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = status;
        order.statusHistory.push({ status, note: note || "Updated by admin", updatedAt: new Date() });
        await order.save();

        const updated = await Order.findById(order._id)
            .populate("user", "name email mobile phone")
            .populate("items.product");
        res.json(updated);
    } catch (err) {
        console.log("Manual status update failed:", err.message);
        res.status(500).json({ message: "Could not update order status" });
    }
});

router.put("/:id/return", adminAuth, async (req, res) => {
    try {
        const allowedStatuses = ["Requested", "Approved", "Rejected", "Refunded"];
        const status = String(req.body?.status || "").trim();

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json("Invalid return status");
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json("Order not found");
        }

        if (!order.returnRequest?.status || order.returnRequest.status === "None") {
            return res.status(400).json("No return request found for this order");
        }

        const currentReturn = typeof order.returnRequest?.toObject === "function"
            ? order.returnRequest.toObject()
            : order.returnRequest;

        order.returnRequest = {
            ...currentReturn,
            status,
            adminNote: String(req.body?.adminNote || order.returnRequest.adminNote || "").trim(),
            updatedAt: new Date(),
        };

        await order.save();
        await order.populate("user", "name email mobile phone");
        await order.populate("items.product");

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json("Return update failed");
    }
});

router.post("/:id/shiprocket/create", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email mobile phone")
            .populate("items.product");

        if (!order) {
            return res.status(404).json("Order not found");
        }

        if (order.shiprocket?.shipmentId) {
            return res.json(order);
        }

        const updated = await createRealShipmentForOrder(order._id);

        res.json(updated);
    } catch (err) {
        console.log("Shiprocket create order failed:", err.response || err.message);

        await Order.findByIdAndUpdate(req.params.id, {
            "shiprocket.lastError": err.message || "Shiprocket order creation failed",
            "shiprocket.updatedAt": new Date(),
        });

        res.status(400).json({ message: err.message || "Shiprocket order creation failed" });
    }
});

router.post("/:id/shiprocket/awb", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order?.shiprocket?.shipmentId) {
            return res.status(400).json("Create Shiprocket order first");
        }

        const result = await assignShiprocketAwb({
            shipmentId: order.shiprocket.shipmentId,
            courierId: req.body?.courierId,
        });

        const updated = await Order.findByIdAndUpdate(
            order._id,
            {
                status: "Shipped",
                "shiprocket.awbCode": result?.response?.data?.awb_code || result?.awb_code || order.shiprocket.awbCode,
                "shiprocket.courierCompanyId": result?.response?.data?.courier_company_id || req.body?.courierId,
                "shiprocket.courierName": result?.response?.data?.courier_name || result?.courier_name,
                "shiprocket.status": result?.message || "AWB Assigned",
                "shiprocket.lastResponse": result,
                "shiprocket.updatedAt": new Date(),
            },
            { returnDocument: "after" }
        )
            .populate("user", "name email mobile phone")
            .populate("items.product");

        res.json(updated);
    } catch (err) {
        console.log("Shiprocket AWB failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket AWB assignment failed" });
    }
});

router.post("/:id/shiprocket/couriers", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json("Order not found");
        }

        if (!order.shippingAddress?.pincode) {
            return res.status(400).json("Delivery pincode missing");
        }

        if (!process.env.SHIPROCKET_PICKUP_PINCODE) {
            return res.status(400).json("SHIPROCKET_PICKUP_PINCODE is not configured");
        }

        const serviceability = await checkShiprocketServiceability({
            pickupPostcode: process.env.SHIPROCKET_PICKUP_PINCODE,
            deliveryPostcode: order.shippingAddress.pincode,
            cod: order.paymentMethod === "COD",
            weight: process.env.SHIPROCKET_DEFAULT_WEIGHT_KG,
        });

        if (!serviceability.available) {
            return res.status(400).json({ message: "No Shiprocket courier available for this order pincode" });
        }

        const couriers = serviceability.couriers.map((item) => ({
            courierCompanyId: item.courier_company_id,
            courierName: item.courier_name,
            rate: item.rate,
            etd: item.etd,
            estimatedDeliveryDays: item.estimated_delivery_days,
        }));

        const updated = await Order.findByIdAndUpdate(
            order._id,
            {
                "shiprocket.availableCouriers": couriers,
                "shiprocket.updatedAt": new Date(),
            },
            { returnDocument: "after" }
        )
            .populate("user", "name email mobile phone")
            .populate("items.product");

        res.json(updated);
    } catch (err) {
        console.log("Shiprocket courier check failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket courier check failed" });
    }
});

router.post("/:id/shiprocket/pickup", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order?.shiprocket?.shipmentId) {
            return res.status(400).json("Create Shiprocket order first");
        }

        const result = await generateShiprocketPickup(order.shiprocket.shipmentId);

        const updated = await Order.findByIdAndUpdate(
            order._id,
            {
                "shiprocket.pickupTokenNumber": result?.pickup_token_number,
                "shiprocket.status": result?.message || "Pickup Generated",
                "shiprocket.lastResponse": result,
                "shiprocket.updatedAt": new Date(),
            },
            { returnDocument: "after" }
        )
            .populate("user", "name email mobile phone")
            .populate("items.product");

        res.json(updated);
    } catch (err) {
        console.log("Shiprocket pickup failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket pickup generation failed" });
    }
});

router.post("/:id/shiprocket/label", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order?.shiprocket?.shipmentId) {
            return res.status(400).json("Create Shiprocket order first");
        }

        if (!order.shiprocket?.awbCode) {
            return res.status(400).json("Assign AWB before generating label");
        }

        const result = await generateShiprocketLabel(order.shiprocket.shipmentId);

        const updated = await Order.findByIdAndUpdate(
            order._id,
            {
                "shiprocket.labelUrl": result?.label_url || order.shiprocket.labelUrl,
                "shiprocket.status": result?.response || "Label Generated",
                "shiprocket.lastResponse": result,
                "shiprocket.updatedAt": new Date(),
            },
            { returnDocument: "after" }
        )
            .populate("user", "name email mobile phone")
            .populate("items.product");

        res.json(updated);
    } catch (err) {
        console.log("Shiprocket label failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket label generation failed" });
    }
});

router.get("/:id/shiprocket/tracking", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (String(order.user) !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const updated = await syncShiprocketTracking(order);
        res.json(updated);
    } catch (err) {
        console.log("Shiprocket tracking failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket tracking failed" });
    }
});

router.post("/:id/shiprocket/sync", adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updated = await syncShiprocketTracking(order);
        res.json(updated);
    } catch (err) {
        console.log("Shiprocket admin tracking sync failed:", err.response || err.message);
        res.status(400).json({ message: err.message || "Shiprocket tracking sync failed" });
    }
});

router.delete("/:id", adminAuth, async (req, res) => {
    res.status(405).json("Order deletion is disabled");
});

export default router;
