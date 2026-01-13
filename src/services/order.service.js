const orderDao = require("../daos/order.dao");
const productDao = require("../daos/product.dao");

const calculateItems = async (items) => {
  const computedItems = [];
  let total = 0;

  for (const item of items) {
    const product = await productDao.findProductById(item.product);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
    const lineTotal = product.price * item.quantity;
    total += lineTotal;
    computedItems.push({
      product: product.id,
      quantity: item.quantity,
      price: product.price,
    });
  }

  return { computedItems, total };
};

const createOrder = async (payload) => {
  const { computedItems, total } = await calculateItems(payload.items || []);
  return orderDao.createOrder({
    user: payload.user,
    items: computedItems,
    total,
  });
};

const listOrders = async (filter = {}) => {
  return orderDao.listOrders(filter);
};

const getOrderById = async (id) => {
  const order = await orderDao.findOrderById(id);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  return order;
};

const updateOrderStatus = async (id, status) => {
  const order = await orderDao.updateOrderById(id, { status });
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  return order;
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
};
