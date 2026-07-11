import express from "express";
import {
   getProducts,
   getProductById,
   createProduct,
   getRelatedProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProductById);
router.route("/:id/related").get(getRelatedProducts);

export default router;
