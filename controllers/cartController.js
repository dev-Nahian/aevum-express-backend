import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/**
 * @desc    Get user cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart) {
      // Create cart if it doesn't exist
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  const { productId, quantity = 1, size } = req.body;

  try {
    if (!productId || !size) {
      res.status(400);
      throw new Error("Product ID and size are required");
    }

    // Find the product to ensure it exists
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

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with same size
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString() && item.size === size
    );

    if (itemIndex > -1) {
      // If product exists in cart with same size, update quantity
      cart.items[itemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      cart.items.push({
        product: product._id,
        quantity: parseInt(quantity),
        size,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const removeFromCart = async (req, res, next) => {
  const { productId, size } = req.body;

  try {
    if (!productId || !size) {
      res.status(400);
      throw new Error("Product ID and size are required");
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

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Filter out the item
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === product._id.toString() && item.size === size)
    );

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  const { productId, size, quantity } = req.body;

  try {
    if (!productId || !size || quantity === undefined) {
      res.status(400);
      throw new Error("Product ID, size, and quantity are required");
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

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString() && item.size === size
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error("Item not found in cart");
    }

    if (parseInt(quantity) <= 0) {
      // If quantity is 0 or less, remove item
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = parseInt(quantity);
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear cart
 * @route   POST /api/cart/clear
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};
