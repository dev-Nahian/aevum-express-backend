import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

/**
 * @desc  Admin: Get all orders with populated user and product info
 * @route GET /api/admin/orders
 */
export const adminGetAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== "all") query.orderStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate("user", "fullName email mobileNumber")
      .populate("items.product", "title image price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Get single order by ID
 * @route GET /api/admin/orders/:id
 */
export const adminGetOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "fullName email mobileNumber")
      .populate("items.product", "title image price category");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Update order status / payment status
 * @route PUT /api/admin/orders/:id
 */
export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Get dashboard stats
 * @route GET /api/admin/stats
 */
export const adminGetStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ isAdmin: false });

    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" });
    const processingOrders = await Order.countDocuments({ orderStatus: "Processing" });
    const shippedOrders = await Order.countDocuments({ orderStatus: "Shipped" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "Cancelled" });

    const recentOrders = await Order.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};
