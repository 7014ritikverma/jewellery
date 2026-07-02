import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  mobile: String,
  name: String,
  email: String,
  phone: String,
  address: String,
  deliveryPincode: String,
  deliveryCity: String,
  deliveryState: String,
  password: String,
});

export default mongoose.model("User", userSchema);
