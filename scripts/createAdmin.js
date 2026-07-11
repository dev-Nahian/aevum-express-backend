/**
 * Creates the first admin user directly in the database
 * Usage: node scripts/createAdmin.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const ADMIN_EMAIL = "admin@aevum.com";
const ADMIN_PASSWORD = "Admin@2026";
const ADMIN_NAME = "Aevum Admin";
const ADMIN_MOBILE = "01700000000";

await mongoose.connect(process.env.MONGODB_URI);
console.log("✅  MongoDB connected to:", process.env.MONGODB_URI.split("/").pop().split("?")[0]);

const existing = await User.findOne({ email: ADMIN_EMAIL });
if (existing) {
  existing.isAdmin = true;
  existing.isVerified = true;
  await existing.save();
  console.log(`✅  Existing user promoted to admin: ${ADMIN_EMAIL}`);
} else {
  await User.create({
    fullName: ADMIN_NAME,
    email: ADMIN_EMAIL,
    mobileNumber: ADMIN_MOBILE,
    password: ADMIN_PASSWORD,   // let Mongoose pre-save hook hash it
    agreeTerms: true,
    isVerified: true,
    isAdmin: true,
  });
  console.log(`✅  Admin user created!`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

await mongoose.disconnect();
