import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
    const exists = await User.findOne({ mobile: req.body.mobile });

    if (exists) return res.status(400).json("User already exists");

    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = new User({
        name: req.body.name || "",
        email: req.body.email || "",
        mobile: req.body.mobile,
        phone: req.body.phone || req.body.mobile || "",
        address: req.body.address || "",
        password: hashed,
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});

// LOGIN
router.post("/login", async (req, res) => {
    const user = await User.findOne({ mobile: req.body.mobile });

    if (!user) return res.status(400).json("User not found");

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) return res.status(400).json("Wrong password");

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
});

// 🔥 GET USER PROFILE
router.get("/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json("Error fetching profile");
    }
});

// 🔥 GET ALL USERS (ADMIN)
router.get("/all", adminAuth, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json("Error fetching users");
    }
});

// 🔥 UPDATE PROFILE
router.put("/profile", auth, async (req, res) => {
    try {
        const updates = {};

        ["name", "email", "mobile", "phone", "address", "deliveryPincode", "deliveryCity", "deliveryState"].forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = typeof req.body[field] === "string"
                    ? req.body[field].trim()
                    : req.body[field];
            }
        });

        if (updates.mobile && !updates.phone) {
            updates.phone = updates.mobile;
        }

        if (updates.phone && !updates.mobile) {
            updates.mobile = updates.phone;
        }

        const updated = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { returnDocument: "after" }
        ).select("-password");

        res.json(updated);
    } catch (err) {
        res.status(500).json("Update failed");
    }
});

export default router;
