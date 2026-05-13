import express from "express";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

const router = express.Router();

// REGISTER (ONLY ONE ADMIN)
router.post("/register", async (req, res) => {
    const existing = await Admin.findOne();

    if (existing) {
        return res.status(400).json("Admin already exists ❌");
    }

    const hashed = await bcrypt.hash(req.body.password, 10);

    const admin = new Admin({
        email: req.body.email,
        password: hashed,
    });

    await admin.save();

    res.json("Admin Registered ✅");
});

// LOGIN
router.post("/login", async (req, res) => {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) return res.status(400).json("Admin not found ❌");

    const isMatch = await bcrypt.compare(req.body.password, admin.password);

    if (!isMatch) return res.status(400).json("Wrong password ❌");

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    res.json({ token });
});

// UPDATE ADMIN
router.put("/update", auth, async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminId = req.user.id;

        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        await Admin.findByIdAndUpdate(adminId, updateData);

        res.json("Admin updated successfully ✅");
    } catch (err) {
        res.status(500).json("Update failed ❌");
    }
});

export default router;