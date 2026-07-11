/**
 * Script to promote a user to admin by email
 * Usage: node scripts/makeAdmin.js user@example.com
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("❌  Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log("✅  MongoDB connected");

const user = await User.findOne({ email });

if (!user) {
  console.error(`❌  No user found with email: ${email}`);
  process.exit(1);
}

user.isAdmin = true;
await user.save();

console.log(`✅  ${user.fullName} (${user.email}) is now an admin!`);
await mongoose.disconnect();
