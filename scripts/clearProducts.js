import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

// Load environment variables
dotenv.config();

const clearDatabaseAndUploads = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear Product collection
    console.log("Clearing all products from database...");
    const result = await Product.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} products.`);

    // Clear uploads folder
    const uploadsDir = "./uploads";
    if (fs.existsSync(uploadsDir)) {
      console.log("Clearing uploaded image files...");
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
      console.log("Successfully cleared uploaded files.");
    }

    console.log("Cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`Error during cleanup: ${error.message}`);
    process.exit(1);
  }
};

clearDatabaseAndUploads();
