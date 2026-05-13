import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { mobile, password, name, email } = req.body;

    if (!mobile?.trim() || !password?.trim()) {
      return res.status(400).json("Mobile and password are required");
    }

    const trimmedMobile = mobile.trim();
    const exists = await User.findOne({ mobile: trimmedMobile });

    if (exists?.password) {
      return res.status(400).json("User already exists, please login");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = exists || new User();

    user.mobile = trimmedMobile;
    user.phone = trimmedMobile;
    user.password = hashed;
    user.name = name?.trim() || user.name;
    user.email = email?.trim() || user.email;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json("Signup failed");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile: mobile?.trim() });

    if (!user) {
      return res.status(400).json("User not found");
    }

    if (!user.password) {
      return res.status(400).json("Please signup again with password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json("Wrong password");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json("Login failed");
  }
});

export default router;
