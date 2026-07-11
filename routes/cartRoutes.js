import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect); // All cart routes are protected

router.route("/")
  .get(getCart)
  .post(addToCart)
  .put(updateCartItem)
  .delete(removeFromCart);

router.post("/clear", clearCart);

export default router;
