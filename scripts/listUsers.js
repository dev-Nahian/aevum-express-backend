import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log("Users in database:");
  users.forEach(u => {
    console.log(`- ${u.fullName} (${u.email}) - Admin: ${u.isAdmin}`);
  });
  await mongoose.disconnect();
};

run();
