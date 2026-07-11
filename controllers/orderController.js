import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";

/**
 * @desc    Create a new order (Checkout)
 * @route   POST /api/orders
 * @access  Public (Guest or Logged-in)
 */
export const createOrder = async (req, res, next) => {
  const { shippingAddress, paymentMethod, promotionalCode, items, fromCart } = req.body;

  try {
    if (!shippingAddress || !paymentMethod) {
      res.status(400);
      throw new Error("Shipping address and payment method are required");
    }

    let orderItems = [];

    // 1. Resolve order items
    if (fromCart && req.user) {
      // If order is from cart and user is logged in, fetch cart items from database
      const userCart = await Cart.findOne({ user: req.user._id });
      if (!userCart || userCart.items.length === 0) {
        res.status(400);
        throw new Error("Your cart is empty");
      }
      
      // Map cart items
      for (const cartItem of userCart.items) {
        const product = await Product.findById(cartItem.product);
        if (!product) {
          res.status(404);
          throw new Error(`Product not found for ID: ${cartItem.product}`);
        }
        orderItems.push({
          product: product._id,
          quantity: cartItem.quantity,
          size: cartItem.size,
          price: product.priceVal,
        });
      }

      // Clear cart after order is placed
      userCart.items = [];
      await userCart.save();
    } else if (items && items.length > 0) {
      // Items provided directly in the request (direct checkout or guest cart checkout)
      for (const item of items) {
        let product;
        
        // Find product by MongoDB ID or custom numeric ID
        if (String(item.productId).match(/^[0-9a-fA-F]{24}$/)) {
          product = await Product.findById(item.productId);
        } else if (!isNaN(item.productId)) {
          product = await Product.findOne({ id: parseInt(item.productId) });
        }

        if (!product) {
          res.status(404);
          throw new Error(`Product not found with ID: ${item.productId}`);
        }

        orderItems.push({
          product: product._id,
          quantity: item.quantity || 1,
          size: item.size || "100ml", // default size if not provided
          price: product.priceVal,
        });
      }
    } else {
      res.status(400);
      throw new Error("No order items provided");
    }

    // 2. Calculate Subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 3. Apply Promotional Code Discount
    let discountApplied = 0;
    if (promotionalCode) {
      const promo = promotionalCode.trim().toUpperCase();
      if (["AEVUMWELCOME", "LUXURY10", "ATELIER10"].includes(promo)) {
        discountApplied = Math.round(subtotal * 0.1);
      } else if (promo === "ATELIER50") {
        discountApplied = Math.round(subtotal * 0.5);
      }
    }

    // 4. Calculate final total
    const shipping = 0; // Complimentary luxury shipping
    const total = subtotal - discountApplied + shipping;

    // 5. Create Order
    const orderData = {
      items: orderItems,
      shippingAddress,
      paymentMethod,
      promotionalCode,
      discountApplied,
      subtotal,
      shipping,
      total,
      paymentStatus: paymentMethod === "cash_on_delivery" ? "Pending" : "Paid", // assume digital is paid
    };

    // If user is authenticated, attach user ID
    if (req.user) {
      orderData.user = req.user._id;
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Public (so receipt/confirmation page can fetch it by ID)
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product")
      .populate("user", "fullName email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin overview)
 * @route   GET /api/orders
 * @access  Private/Admin (protected in routes)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate("items.product")
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};
