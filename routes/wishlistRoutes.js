import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect); // Protect all wishlist endpoints

router.route("/")
  .get(getWishlist)
  .post(addToWishlist)
  .delete(removeFromWishlist);

router.post("/clear", clearWishlist);

export default router;
