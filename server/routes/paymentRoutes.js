import express from "express";
import Razorpay from "razorpay";
import axios from "axios";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: "rzp_test_Sk6uW9CCim2n1n",
  key_secret: "N2xivobtHxiBph8ojyBP75qY"
});

const RAZORPAY_MAX_AMOUNT = 10000000; // max Razorpay amount in paise (100,000 INR)

// CREATE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    console.log("[payment/create-order] request body:", req.body, "parsed amount:", amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid payment amount."
      });
    }

    const amountInPaisa = Math.round(amount * 100);

    if (amountInPaisa > RAZORPAY_MAX_AMOUNT) {
      return res.status(400).json({
        error: "Amount exceeds Razorpay maximum limit of ₹100000. Please reduce your order amount."
      });
    }

    const options = {
      amount: amountInPaisa,
      currency: "INR",
      receipt: "order_rcptid_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (err) {
    console.error("Payment create-order error:", err);

    const errorMessage =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      "Payment order creation failed.";

    res.status(500).json({
      error: errorMessage
    });
  }
});

router.get("/check-pincode/:pincode", async (req, res) => {

  try {

    const { pincode } = req.params;

    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    const data = response.data[0];

    if (data.Status !== "Success") {
      return res.json({
        available: false
      });
    }

    const postOffice = data.PostOffice[0];

    let days = 5;

    if (postOffice.State === "Rajasthan") {
      days = 2;
    }

    else if (postOffice.State === "Delhi") {
      days = 3;
    }

    else if (postOffice.State === "Maharashtra") {
      days = 4;
    }

    res.json({
      available: true,
      city: postOffice.District,
      state: postOffice.State,
      days
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
});

export default router;