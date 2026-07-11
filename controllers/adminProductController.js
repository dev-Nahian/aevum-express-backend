import Product from "../models/Product.js";

/**
 * @desc  Admin: Get all products (no pagination limit)
 * @route GET /api/admin/products
 */
export const adminGetProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Create product
 * @route POST /api/admin/products
 */
export const adminCreateProduct = async (req, res, next) => {
  try {
    // Auto-generate numeric id if not provided
    if (!req.body.id) {
      const last = await Product.findOne().sort({ id: -1 });
      req.body.id = last ? last.id + 1 : 1;
    }
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Update product
 * @route PUT /api/admin/products/:id
 */
export const adminUpdateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Admin: Delete product
 * @route DELETE /api/admin/products/:id
 */
export const adminDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};
