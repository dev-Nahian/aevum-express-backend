import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);
await User.deleteOne({ email: "admin@aevum.com" });
console.log("Deleted admin@aevum.com");
await mongoose.disconnect();
