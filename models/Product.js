import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    price: {
      type: String,
      required: [true, "Display price is required"],
    },
    priceVal: {
      type: Number,
      required: [true, "Price numerical value is required"],
    },
    category: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    productType: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Perfumes"],
      trim: true,
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
    },
    availability: {
      type: String,
      default: "In Stock",
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestSelling: {
      type: Boolean,
      default: false,
    },
    newest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
