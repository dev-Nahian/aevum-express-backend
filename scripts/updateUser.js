import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: "tester1@aevum.com" });
    if (user) {
      user.password = "password123";
      user.isVerified = true;
      await user.save();
      console.log("Successfully updated tester1@aevum.com's password and verified status.");
    } else {
      console.log("tester1@aevum.com not found.");
    }
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
