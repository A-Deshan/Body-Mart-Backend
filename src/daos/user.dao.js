const User = require("../models/user.model");

const createUser = async (payload) => {
  return User.create(payload);
};

const findUserByEmail = async (email) => {
  return User.findOne({ email }).select("+password");
};

const findUserById = async (id) => {
  return User.findById(id);
};

const listUsers = async () => {
  return User.find();
};

const updateUserById = async (id, update) => {
  return User.findByIdAndUpdate(id, update, { new: true });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserById,
};
