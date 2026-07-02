import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
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

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const findUserByMobile = (mobile) => {
  return User.findOne({
    $or: [
      { mobile },
      { phone: mobile },
      { mobile: `91${mobile}` },
      { phone: `91${mobile}` },
    ],
  });
};

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

    const token = createToken(user);

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

    const token = createToken(user);

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json("Login failed");
  }
});

router.post(
  "/otp/request",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "otp-request" }),
  async (req, res) => {
    try {
      const mobile = normalizeMobile(req.body.mobile);

      if (!mobile) {
        return res.status(400).json("Valid 10 digit mobile number is required");
      }

      const user = await findUserByMobile(mobile);

      if (!user) {
        return res.status(404).json("Account not found. Please signup first");
      }

      const existingOtp = await Otp.findOne({ mobile, purpose: "user" });
      const now = new Date();

      if (existingOtp?.resendAvailableAt > now) {
        const waitSeconds = Math.ceil((existingOtp.resendAvailableAt.getTime() - now.getTime()) / 1000);
        return res.status(429).json(`Please wait ${waitSeconds}s before requesting another OTP`);
      }

      const otp = String(crypto.randomInt(100000, 1000000));
      const otpHash = hashOtp(mobile, otp);

      await Otp.findOneAndUpdate(
        { mobile, purpose: "user" },
        {
          mobile,
          purpose: "user",
          targetId: user._id,
          otpHash,
          attempts: 0,
          resendAvailableAt: new Date(Date.now() + OTP_RESEND_COOLDOWN_MS),
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const provider = await sendOtpSms({ mobile, otp });

      res.json({ message: "OTP sent successfully", provider });
    } catch (err) {
      console.log(err);
      res.status(500).json("OTP send failed");
    }
  }
);

router.post(
  "/otp/verify",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "otp-verify" }),
  async (req, res) => {
    try {
      const mobile = normalizeMobile(req.body.mobile);
      const otp = String(req.body.otp || "").replace(/\D/g, "");

      if (!mobile || otp.length !== 6) {
        return res.status(400).json("Valid mobile number and 6 digit OTP are required");
      }

      const otpRecord = await Otp.findOne({ mobile, purpose: "user" });

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

      const user = await findUserByMobile(mobile);

      if (!user) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(404).json("Account not found. Please signup first");
      } else if (!user.phone) {
        user.phone = mobile;
        await user.save();
      }

      await Otp.deleteOne({ _id: otpRecord._id });

      res.json({
        token: createToken(user),
        user: {
          id: user._id,
          mobile: user.mobile,
          name: user.name || "",
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json("OTP verification failed");
    }
  }
);

export default router;
