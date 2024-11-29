const Category = require("../models/Category");

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.getAll(req.user.id);
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

exports.getByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type. Must be 'income' or 'expense'",
      });
    }

    const categories = await Category.getByType(req.user.id, type);
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories by type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Category name and type are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type. Must be 'income' or 'expense'",
      });
    }

    const result = await Category.create({
      name,
      type,
      user_id: req.user.id,
    });

    res.status(201).json({
      success: true,
      categoryId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Category name and type are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type. Must be 'income' or 'expense'",
      });
    }

    const category = await Category.findById(id, req.user.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Category.update(id, req.user.id, { name, type });
    res.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id, req.user.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Don't allow deletion of default categories (where user_id is NULL)
    if (!category.user_id) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete default categories",
      });
    }

    await Category.delete(id, req.user.id);
    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id, req.user.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};
