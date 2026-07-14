import Product from "../models/Product.js";

/**
 * @desc    Get all products with filters, sorting & pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      productType,
      category,
      subCategory,
      availability,
      featured,
      bestSelling,
      newest,
      search,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Apply filters if provided
    if (productType) {
      query.productType = { $regex: new RegExp(`^${productType}$`, "i") };
    }
    if (category) {
      if (category.toLowerCase() === "fragrance" || category.toLowerCase() === "perfumes") {
        query.$or = [
          { category: { $regex: /^(fragrance|perfumes)$/i } },
          { productType: { $regex: /^(perfumes)$/i } }
        ];
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, "i") };
      }
    }
    if (subCategory) {
      query.subCategory = { $regex: new RegExp(`^${subCategory}$`, "i") };
    }
    if (availability) {
      query.availability = availability;
    }
    if (featured !== undefined) {
      query.featured = featured === "true";
    }
    if (bestSelling !== undefined) {
      query.bestSelling = bestSelling === "true";
    }
    if (newest !== undefined) {
      query.newest = newest === "true";
    }

    // Search filter (title or category)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { subCategory: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    let sortOptions = {};
    if (sort) {
      if (sort === "price-asc") {
        sortOptions = { priceVal: 1 };
      } else if (sort === "price-desc") {
        sortOptions = { priceVal: -1 };
      } else if (sort === "newest") {
        sortOptions = { createdAt: -1 };
      } else {
        sortOptions = { id: 1 }; // Default sort by numeric ID
      }
    } else {
      sortOptions = { id: 1 }; // Default
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      pages: Math.ceil(totalProducts / parseInt(limit)),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product by numeric ID or MongoDB ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  const { id } = req.params;

  try {
    let product;

    // Check if the id is a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    // If not found by ObjectId or is a numeric ID, search by custom numeric id field
    if (!product && !isNaN(id)) {
      product = await Product.findOne({ id: parseInt(id) });
    }

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a product (Admin or Dev Seeding helper)
 * @route   POST /api/products
 * @access  Private/Public (Admin should be protected, public for development seeding)
 */
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get related products (You May Also Like)
 * @route   GET /api/products/:id/related
 * @access  Public
 */
export const getRelatedProducts = async (req, res, next) => {
  const { id } = req.params;
  try {
    let currentProduct;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      currentProduct = await Product.findById(id);
    }
    if (!currentProduct && !isNaN(id)) {
      currentProduct = await Product.findOne({ id: parseInt(id) });
    }

    if (!currentProduct) {
      res.status(404);
      throw new Error("Product not found");
    }

    const query = {
      _id: { $ne: currentProduct._id },
      $or: [
        { productType: currentProduct.productType },
        { subCategory: currentProduct.subCategory },
      ],
    };

    const relatedProducts = await Product.find(query).limit(5);

    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      products: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get autocomplete product suggestions
 * @route   GET /api/products/search/suggestions
 * @access  Public
 */
export const getProductSuggestions = async (req, res, next) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    const query = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { subCategory: { $regex: q, $options: "i" } },
      ],
    };

    const products = await Product.find(query)
      .select("id _id title image price category")
      .limit(6);

    res.status(200).json({
      success: true,
      suggestions: products,
    });
  } catch (error) {
    next(error);
  }
};
