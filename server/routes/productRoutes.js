import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();


// 🔥 ADD PRODUCT
router.post("/", auth, async (req, res) => {
  try {
    console.log(req.body);

    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      subCategory: req.body.subCategory,
      inspiration: req.body.inspiration || "",
      design: req.body.design || [],
      images: req.body.images || [],
    });

    await product.save();

    res.json(product);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


// 🔥 GET ALL PRODUCTS
router.get("/", async (req, res) => {

  try {

    const { type } = req.query;

    let products;

    // 🔥 NEW ARRIVAL
    if (type === "new") {

      products = await Product.find()
        .sort({ createdAt: -1 });

    }

    // 🔥 BESTSELLER
    else if (type === "bestseller") {

      products = await Product.find()
        .sort({
          avgRating: -1,
          sold: -1
        });

    }

    // 🔥 NORMAL PRODUCTS
    else {

      products = await Product.find();

    }

    res.json(products);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json("Error");
  }
});

router.post("/:id/reviews", auth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!orderId) {
      return res.status(400).json("Order is required for review");
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json("Rating must be between 1 and 5");
    }

    if (!comment?.trim()) {
      return res.status(400).json("Review comment is required");
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      status: "Delivered",
      "items.product": req.params.id
    });

    if (!order) {
      return res.status(400).json("Review allowed only after delivered order");
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json("Product not found");
    }

    const alreadyReviewed = product.reviews.some((review) =>
      String(review.user) === req.user.id &&
      String(review.order) === String(orderId)
    );

    if (alreadyReviewed) {
      return res.status(400).json("Review already submitted for this order");
    }

    const user = await User.findById(req.user.id).select("name mobile");

    product.reviews.push({
      user: req.user.id,
      order: orderId,
      name: user?.name || user?.mobile || "Customer",
      rating: numericRating,
      comment: comment.trim()
    });

    product.reviewCount = product.reviews.length;
    product.avgRating = Number(
      (
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviewCount
      ).toFixed(1)
    );

    await product.save();

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json("Review failed");
  }
});


// 🔥 UPDATE PRODUCT (SAFE)
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json("Product not found");
    }

    // 🔥 Update fields safely
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category;
    product.subCategory = req.body.subCategory || product.subCategory;

    product.inspiration = req.body.inspiration || product.inspiration;

    product.design = req.body.design || product.design;

    product.images = req.body.images || product.images;

    await product.save();

    res.json(product);

  } catch (err) {
    console.log(err);
    res.status(500).json("Update Error ❌");
  }
});


// 🔥 DELETE PRODUCT
router.delete("/:id", auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json("Product Deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
