import Review from "../models/Review.js";
import Product from "../models/Product.js";

/**
 * @desc    Get all reviews for a product
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
export const getProductReviews = async (req, res, next) => {
  const { id } = req.params;

  try {
    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product && !isNaN(id)) {
      product = await Product.findOne({ id: parseInt(id) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = await Review.find({ product: product._id, status: "approved" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const numReviews = reviews.length;
    const avgRating = numReviews > 0
      ? (reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      count: numReviews,
      avgRating: parseFloat(avgRating),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createReview = async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    if (rating === undefined || rating === null || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating and a comment",
      });
    }

    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product && !isNaN(id)) {
      product = await Product.findOne({ id: parseInt(id) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const alreadyReviewed = await Review.findOne({
      product: product._id,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
};
