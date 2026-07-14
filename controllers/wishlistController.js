import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

/**
 * @desc    Get user wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  const { productId } = req.body;

  try {
    if (!productId) {
      res.status(400);
      throw new Error("Product ID is required");
    }

    let product;
    if (String(productId).match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    } else if (!isNaN(productId)) {
      product = await Product.findOne({ id: parseInt(productId) });
    }

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Check if product is already in wishlist
    if (!wishlist.products.includes(product._id)) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }

    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from wishlist
 * @route   DELETE /api/wishlist
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  const { productId } = req.body;

  try {
    if (!productId) {
      res.status(400);
      throw new Error("Product ID is required");
    }

    let product;
    if (String(productId).match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    } else if (!isNaN(productId)) {
      product = await Product.findOne({ id: parseInt(productId) });
    }

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (pId) => pId.toString() !== product._id.toString()
    );

    await wishlist.save();
    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear wishlist
 * @route   POST /api/wishlist/clear
 * @access  Private
 */
export const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};
