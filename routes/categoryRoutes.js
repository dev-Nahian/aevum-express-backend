import express from "express";
import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/admin.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Public route to fetch all categories
router.route("/").get(getCategories);

// Admin-only protected routes to manage categories
router.route("/").post(protect, adminOnly, createCategory);
router.route("/:id")
  .put(protect, adminOnly, updateCategory)
  .delete(protect, adminOnly, deleteCategory);

export default router;
