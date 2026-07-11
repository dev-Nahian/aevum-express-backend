import User from "../models/User.js";

/**
 * @desc  Middleware to check if logged-in user is an admin
 *        Must be used AFTER protect middleware
 */
export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admins only.");
    }
    next();
  } catch (error) {
    next(error);
  }
};
