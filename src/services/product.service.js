const productDao = require("../daos/product.dao");

const createProduct = async (payload) => {
  return productDao.createProduct(payload);
};

const listProducts = async () => {
  return productDao.listProducts({ isActive: true });
};

const getProductById = async (id) => {
  const product = await productDao.findProductById(id);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const updateProduct = async (id, update) => {
  const product = await productDao.updateProductById(id, update);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const deleteProduct = async (id) => {
  const product = await productDao.deleteProductById(id);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  return product;
};

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
