import express from "express";
import {
   getProducts,
   getProductById,
   createProduct,
   getRelatedProducts,
   getProductSuggestions,
} from "../controllers/productController.js";
import { getProductReviews, createReview } from "../controllers/reviewController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.route("/search/suggestions").get(getProductSuggestions);
router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProductById);
router.route("/:id/related").get(getRelatedProducts);
router.route("/:id/reviews").get(getProductReviews).post(protect, createReview);

export default router;
