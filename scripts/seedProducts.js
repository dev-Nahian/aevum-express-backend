import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { products } from "../../Frontend/src/data/products.js";

// Load environment variables
dotenv.config();

const initialCategories = [
  {
    name: "Men",
    slug: "men",
    productType: "Men",
    subCategories: ["T-Shirts", "Drop Shoulder T-Shirts", "Formal Shirts", "Casual Shirts", "Panjabi"],
  },
  {
    name: "Women",
    slug: "women",
    productType: "Women",
    subCategories: ["T-Shirts", "Kamij", "Western Wear", "Deshi Wear"],
  },
  {
    name: "Fragrance",
    slug: "perfumes",
    productType: "Perfumes",
    subCategories: ["Perfumes"],
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear collections
    console.log("Clearing existing products...");
    await Product.deleteMany({});

    console.log("Clearing existing categories...");
    await Category.deleteMany({});

    // Seed products
    console.log(`Seeding ${products.length} products...`);
    await Product.insertMany(products);

    // Seed categories
    console.log(`Seeding ${initialCategories.length} categories...`);
    await Category.insertMany(initialCategories);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
