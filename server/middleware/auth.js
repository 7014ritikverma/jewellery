import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(401).json("No token");
    }

    // 🔥 handle "Bearer TOKEN" OR "TOKEN"
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = { id: decoded.id };

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err.message); // 🔥 debug
    res.status(401).json("Invalid token");
  }
};

export default auth;