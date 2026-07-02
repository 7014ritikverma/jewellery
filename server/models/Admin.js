import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: String,
  mobile: String,
  password: String,
});

export default mongoose.model("Admin", adminSchema);
