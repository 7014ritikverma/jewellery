import express from "express";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

// CREATE ORDER
router.post("/", auth, async (req, res) => {
    try {
        const { items, total, address, paymentMethod, paymentStatus } = req.body;

        if (!items?.length || items.some((item) => !item.product || !item.qty)) {
            return res.status(400).json("Order item missing");
        }

        if (!address?.trim()) {
            return res.status(400).json("Delivery address is required");
        }

        const order = new Order({
            user: req.user.id,
            items,
            total,
            address: address.trim(),
            paymentMethod,
            paymentStatus
        });

        await order.save();
        for (const item of items) {

            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: { sold: item.qty }
                }
            );
        }
        res.json(order);

    } catch (err) {
        res.status(500).json(err);
    }
});

// GET USER ORDERS
router.get("/my-orders", auth, async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .populate("items.product");

    res.json(orders);
});

// GET ALL ORDERS (ADMIN)
router.get("/all", auth, async (req, res) => {
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

router.get("/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("items.product");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// UPDATE STATUS
router.put("/:id", auth, async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE DELIVERED ORDER
router.delete("/:id", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json("Order not found");
        }

        if (order.status !== "Delivered") {
            return res.status(400).json("Only delivered orders can be deleted");
        }

        await Order.findByIdAndDelete(req.params.id);

        res.json({ message: "Order deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
