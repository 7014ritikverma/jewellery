import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const getToken = (req) => {
  const header = req.header("Authorization");

  if (!header) return null;

  return header.startsWith("Bearer ") ? header.split(" ")[1] : header;
};

const auth = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json("No token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin") {
      return res.status(403).json("User access required");
    }

    req.user = { id: decoded.id, role: decoded.role || "user" };

    next();
  } catch (err) {
    res.status(401).json("Invalid token");
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json("No token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminExists = await Admin.exists({ _id: decoded.id });

    if (!adminExists) {
      return res.status(403).json("Admin access required");
    }

    req.user = { id: decoded.id, role: "admin" };

    next();
  } catch (err) {
    res.status(401).json("Invalid token");
  }
};

export default auth;
