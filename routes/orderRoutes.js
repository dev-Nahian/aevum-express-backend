import express from "express";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
} from "../controllers/orderController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Allow optional protect middleware (guest checkout vs authenticated checkout)
router.route("/").post((req, res, next) => {
  // If Authorization header is present, enforce protect middleware, otherwise proceed as guest
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
}, createOrder).get(protect, getAllOrders);

router.route("/my-orders").get(protect, getMyOrders);
router.route("/:id").get(getOrderById);

export default router;
