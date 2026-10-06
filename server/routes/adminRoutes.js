import express from "express";
import Admin from "../models/Admin.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { adminAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/security.js";
import { sendOtpSms } from "../utils/sendSms.js";

const router = express.Router();

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 30;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizeMobile = (mobile = "") => {
    const digits = String(mobile).replace(/\D/g, "");
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    return "";
};

const hashOtp = (mobile, otp) => {
    return crypto
        .createHmac("sha256", process.env.JWT_SECRET)
        .update(`${mobile}:${otp}`)
        .digest("hex");
};

const createAdminToken = (admin) => {
    return jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
};

const getAdminOtpMobile = (admin) => {
    return normalizeMobile(admin.mobile || process.env.ADMIN_OTP_MOBILE);
};

// REGISTER (ONLY ONE ADMIN)
router.post("/register", rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: "admin-register" }), async (req, res) => {
    if (process.env.ADMIN_SETUP_KEY && req.header("x-admin-setup-key") !== process.env.ADMIN_SETUP_KEY) {
        return res.status(403).json("Invalid setup key");
    }

    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");
    const mobile = normalizeMobile(req.body.mobile);

    if (!email || !password || !mobile) {
        return res.status(400).json("Email, password and 10 digit mobile are required");
    }

    const existing = await Admin.findOne();

    if (existing) {
        return res.status(400).json("Admin already exists ❌");
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = new Admin({
        email,
        mobile,
        password: hashed,
    });

    await admin.save();

    res.json("Admin Registered ✅");
});

// LOGIN
router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "admin-login" }), async (req, res) => {
    return res.status(400).json("Use admin OTP login");

    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) return res.status(400).json("Admin not found ❌");

    const isMatch = await bcrypt.compare(req.body.password, admin.password);

    if (!isMatch) return res.status(400).json("Wrong password ❌");

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({ token });
});

router.post("/otp/request", rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "admin-otp-request" }), async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });

        if (!admin) return res.status(400).json("Admin not found");

        const isMatch = await bcrypt.compare(req.body.password || "", admin.password);

        if (!isMatch) return res.status(400).json("Wrong password");

        const mobile = getAdminOtpMobile(admin);

        if (!mobile) {
            return res.status(400).json("Admin mobile number is not configured");
        }

        const existingOtp = await Otp.findOne({ mobile, purpose: "admin", targetId: admin._id });
        const now = new Date();

        if (existingOtp?.resendAvailableAt > now) {
            const waitSeconds = Math.ceil((existingOtp.resendAvailableAt.getTime() - now.getTime()) / 1000);
            return res.status(429).json(`Please wait ${waitSeconds}s before requesting another OTP`);
        }

        const otp = String(crypto.randomInt(100000, 1000000));

        await Otp.findOneAndUpdate(
            { mobile, purpose: "admin", targetId: admin._id },
            {
                mobile,
                purpose: "admin",
                targetId: admin._id,
                otpHash: hashOtp(mobile, otp),
                attempts: 0,
                resendAvailableAt: new Date(Date.now() + OTP_RESEND_COOLDOWN_MS),
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const provider = await sendOtpSms({ mobile, otp });

        res.json({ message: "Admin OTP sent successfully", provider });
    } catch (err) {
        console.log(err);
        res.status(500).json("Admin OTP send failed");
    }
});

router.post("/otp/verify", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "admin-otp-verify" }), async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        const otp = String(req.body.otp || "").replace(/\D/g, "");

        if (!admin) return res.status(400).json("Admin not found");

        const mobile = getAdminOtpMobile(admin);

        if (!mobile || otp.length !== 6) {
            return res.status(400).json("Valid admin mobile and 6 digit OTP are required");
        }

        const otpRecord = await Otp.findOne({ mobile, purpose: "admin", targetId: admin._id });

        if (!otpRecord || otpRecord.expiresAt <= new Date()) {
            return res.status(400).json("OTP expired. Please request a new OTP");
        }

        if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json("Too many wrong attempts. Please request a new OTP");
        }

        const incomingHash = hashOtp(mobile, otp);
        const savedHash = Buffer.from(otpRecord.otpHash, "hex");
        const incomingHashBuffer = Buffer.from(incomingHash, "hex");
        const isMatch = savedHash.length === incomingHashBuffer.length &&
            crypto.timingSafeEqual(savedHash, incomingHashBuffer);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json("Invalid OTP");
        }

        await Otp.deleteOne({ _id: otpRecord._id });

        res.json({ token: createAdminToken(admin) });
    } catch (err) {
        console.log(err);
        res.status(500).json("Admin OTP verification failed");
    }
});

router.post("/update/request-otp", adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);

        const mobile = getAdminOtpMobile(admin);

        const otp = String(
            crypto.randomInt(100000, 1000000)
        );

        await Otp.findOneAndUpdate(
            {
                mobile,
                purpose: "admin-update",
                targetId: admin._id
            },
            {
                mobile,
                purpose: "admin-update",
                targetId: admin._id,
                otpHash: hashOtp(mobile, otp),
                attempts: 0,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
            { upsert: true }
        );

        await sendOtpSms({ mobile, otp });

        res.json("OTP sent successfully");
    } catch (err) {
        console.log(err);
        res.status(500).json("OTP send failed");
    }
});

// UPDATE ADMIN
// router.put("/update", adminAuth, async (req, res) => {
//     try {
//         const { email, password, mobile } = req.body;
//         const adminId = req.user.id;

//         const updateData = {};
//         if (email) updateData.email = email;
//         if (mobile) updateData.mobile = normalizeMobile(mobile);
//         if (password) updateData.password = await bcrypt.hash(password, 10);

//         await Admin.findByIdAndUpdate(adminId, updateData);

//         res.json("Admin updated successfully ✅");
//     } catch (err) {
//         res.status(500).json("Update failed ❌");
//     }
// });

router.get("/profile", adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("name email mobile profileImage");
        if (!admin) return res.status(404).json("Admin not found");
        res.json(admin);
    } catch (err) {
        console.log(err);
        res.status(500).json("Unable to load admin profile");
    }
});

router.put("/update", adminAuth, async (req, res) => {
    try {
        const { name, email, password, mobile, profileImage, otp } = req.body;

        const admin = await Admin.findById(req.user.id);

        const adminMobile = getAdminOtpMobile(admin);

        const otpRecord = await Otp.findOne({
            mobile: adminMobile,
            purpose: "admin-update",
            targetId: admin._id
        });

        if (!otpRecord) {
            return res.status(400).json("OTP required");
        }

        const incomingHash = hashOtp(adminMobile, otp);

        if (incomingHash !== otpRecord.otpHash) {
            return res.status(400).json("Wrong OTP");
        }

        const updateData = {};

        if (name !== undefined) updateData.name = String(name).trim();
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = normalizeMobile(mobile);
        if (profileImage !== undefined) updateData.profileImage = String(profileImage).trim();

        if (password) {
            updateData.password =
                await bcrypt.hash(password, 10);
        }

        await Admin.findByIdAndUpdate(
            admin._id,
            updateData
        );

        await Otp.deleteOne({ _id: otpRecord._id });

        res.json("Admin updated successfully ✅");
    } catch (err) {
        console.log(err);
        res.status(500).json("Update failed");
    }
});

export default router;
