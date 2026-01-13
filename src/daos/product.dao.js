const Product = require("../models/product.model");

const createProduct = async (payload) => {
  return Product.create(payload);
};

const listProducts = async (filter = {}) => {
  return Product.find(filter);
};

const findProductById = async (id) => {
  return Product.findById(id);
};

const updateProductById = async (id, update) => {
  return Product.findByIdAndUpdate(id, update, { new: true });
};

const deleteProductById = async (id) => {
  return Product.findByIdAndDelete(id);
};

module.exports = {
  createProduct,
  listProducts,
  findProductById,
  updateProductById,
  deleteProductById,
};
