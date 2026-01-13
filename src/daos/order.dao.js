const Order = require("../models/order.model");

const createOrder = async (payload) => {
  return Order.create(payload);
};

const listOrders = async (filter = {}) => {
  return Order.find(filter).populate("items.product").populate("user");
};

const findOrderById = async (id) => {
  return Order.findById(id).populate("items.product").populate("user");
};

const updateOrderById = async (id, update) => {
  return Order.findByIdAndUpdate(id, update, { new: true });
};

module.exports = {
  createOrder,
  listOrders,
  findOrderById,
  updateOrderById,
};
