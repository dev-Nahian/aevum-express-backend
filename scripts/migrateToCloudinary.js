import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads");

const run = async () => {
  // Validate Cloudinary credentials
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error("\n❌  Error: Cloudinary credentials are not configured in Backend/.env");
    console.error("Please add the following variables to your .env file:");
    console.error("  CLOUDINARY_CLOUD_NAME=your_cloud_name");
    console.error("  CLOUDINARY_API_KEY=your_api_key");
    console.error("  CLOUDINARY_API_SECRET=your_api_secret\n");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("❌  Error: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check for local images.`);

  let migratedProductsCount = 0;
  let migratedImagesCount = 0;

  for (const product of products) {
    let updated = false;

    // Helper function to extract filename and upload to Cloudinary
    const migrateField = async (urlStr, fieldName) => {
      if (!urlStr) return urlStr;

      // Check if URL points to a local upload
      if (urlStr.includes("/uploads/")) {
        const parts = urlStr.split("/uploads/");
        const filename = parts[parts.length - 1];
        const localPath = path.join(UPLOADS_DIR, filename);

        if (fs.existsSync(localPath)) {
          console.log(`Uploading ${fieldName} for "${product.title}" (${filename}) to Cloudinary...`);
          try {
            const result = await uploadToCloudinary(localPath, "aevum_products");
            console.log(`   Success! Cloudinary URL: ${result.secure_url}`);
            migratedImagesCount++;
            updated = true;
            return result.secure_url;
          } catch (uploadError) {
            console.error(`   Failed to upload ${filename} to Cloudinary:`, uploadError.message);
          }
        } else {
          console.warn(`   Warning: Local file not found at ${localPath}`);
        }
      }
      return urlStr;
    };

    // Migrate main image
    product.image = await migrateField(product.image, "main image");

    // Migrate size chart image
    if (product.sizeChartImage) {
      product.sizeChartImage = await migrateField(product.sizeChartImage, "size chart image");
    }

    if (updated) {
      await product.save();
      console.log(`Saved product: "${product.title}"`);
      migratedProductsCount++;
    }
  }

  console.log("\n--------------------------------------------------");
  console.log(`✅  Migration completed!`);
  console.log(`    Products updated: ${migratedProductsCount}`);
  console.log(`    Images uploaded:  ${migratedImagesCount}`);
  console.log("--------------------------------------------------\n");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed with error:", err);
  mongoose.disconnect();
});
