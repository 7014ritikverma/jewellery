import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { buildCorsOptions, rateLimit, securityHeaders, validateRequiredEnv } from "./middleware/security.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import metalRoutes from "./routes/metalRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import homeContentRoutes from "./routes/homeContentRoutes.js";
import fetchAndUpdateMetalRates from "./utils/fetchMetalRates.js";


dotenv.config();
validateRequiredEnv();

const app = express();

const corsOptions = buildCorsOptions();

// Middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(securityHeaders);
app.use(rateLimit({ max: 300, keyPrefix: "api" }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/metals", metalRoutes);
app.use("/api/user", userRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/payment", paymentRoutes);   // ✅ MUST
app.use("/api/home-content", homeContentRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("API Running...");
});

// Connect DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));

// Auto-fetch metal rates on startup (if configured) and schedule periodic updates
const intervalMs = Number(process.env.METAL_RATE_POLL_INTERVAL_MS) || 1000 * 60 * 5; // default 5 minutes
let metalRateFetchRunning = false;

const runScheduledMetalFetch = async (label = "scheduled") => {
    if (metalRateFetchRunning) {
        console.log("Metal rate fetch skipped: previous fetch is still running");
        return;
    }

    metalRateFetchRunning = true;

    try {
        const result = await fetchAndUpdateMetalRates();
        if (result?.error) {
            console.log(`${label} metal fetch failed: ${result.error}`);
        } else {
            console.log(`${label} metal rates updated`, result?.rates || {});
        }
    } catch (e) {
        console.log(`${label} metal fetch failed`, e);
    } finally {
        metalRateFetchRunning = false;
    }
};

if (process.env.METAL_RATE_AUTO === "true") {
    // run once immediately
    runScheduledMetalFetch("Initial");

    // schedule periodic
    setInterval(() => {
        runScheduledMetalFetch("Scheduled");
    }, intervalMs);
}
