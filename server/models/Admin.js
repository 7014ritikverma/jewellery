import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" },
  email: String,
  mobile: String,
  password: String,
  profileImage: { type: String, default: "" },
});

export default mongoose.model("Admin", adminSchema);
