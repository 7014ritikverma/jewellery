import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      qty: Number,
      itemPrice: Number,
      itemImage: String,
      variants: [
        {
          group: String,
          option: String,
          image: String,
        }
      ],
    }
  ],

  total: Number,
  originalAmount: Number,
  shippingCharge: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  finalPayableAmount: Number,
  selectedPaymentMethod: {
    type: String,
    enum: ["UPI", "CARD", "WALLET", "COD"],
  },
  address: String,
  deliveryMobile: String,
  estimatedDeliveryDate: Date,
  estimatedDeliveryText: String,
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" }
  },
  status: {
    type: String,
    enum: ["Pending", "Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
    default: "Pending"
  },
  statusHistory: [
    {
      status: String,
      note: String,
      updatedAt: { type: Date, default: Date.now },
    }
  ],

  paymentMethod: {
    type: String,
    enum: ["ONLINE", "COD"],
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  },
  returnRequest: {
    status: {
      type: String,
      enum: ["None", "Requested", "Approved", "Rejected", "Refunded"],
      default: "None"
    },
    reason: String,
    adminNote: String,
    requestedAt: Date,
    updatedAt: Date,
  },
  cashfreeOrderId: String,
  cashfreePaymentSessionId: String,
  cashfreeOrderStatus: String,
  shiprocket: {
    orderId: Number,
    shipmentId: Number,
    awbCode: String,
    courierCompanyId: Number,
    courierName: String,
    availableCouriers: [mongoose.Schema.Types.Mixed],
    status: String,
    trackingUrl: String,
    labelUrl: String,
    manifestUrl: String,
    pickupTokenNumber: String,
    trackingEvents: [
      {
        status: String,
        location: String,
        date: String,
        activity: String,
      }
    ],
    lastTrackedAt: Date,
    lastResponse: mongoose.Schema.Types.Mixed,
    lastError: String,
    createdAt: Date,
    updatedAt: Date,
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
