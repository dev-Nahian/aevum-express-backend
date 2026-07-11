import express from "express";
import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/admin.js";
import {
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminGetStats,
} from "../controllers/adminOrderController.js";
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "../controllers/adminProductController.js";
import {
  adminGetCMS,
  adminUpsertCMS,
  adminDeleteCMS,
} from "../controllers/cmsController.js";
import User from "../models/User.js";

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(protect, adminOnly);

// ── Stats ────────────────────────────────────────────────
router.get("/stats", adminGetStats);

// ── Orders ───────────────────────────────────────────────
router.get("/orders", adminGetAllOrders);
router.get("/orders/:id", adminGetOrderById);
router.put("/orders/:id", adminUpdateOrderStatus);

// ── Products ─────────────────────────────────────────────
router.get("/products", adminGetProducts);
router.post("/products", adminCreateProduct);
router.put("/products/:id", adminUpdateProduct);
router.delete("/products/:id", adminDeleteProduct);

// ── CMS ──────────────────────────────────────────────────
router.get("/cms", adminGetCMS);
router.put("/cms/:key", adminUpsertCMS);
router.delete("/cms/:key", adminDeleteCMS);

// ── Users ─────────────────────────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({ isAdmin: false }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

// ── Make a user admin ─────────────────────────────────────
router.put("/users/:id/make-admin", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: true },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

export default router;
