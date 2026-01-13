const Membership = require("../models/membership.model");

const createMembership = async (payload) => {
  return Membership.create(payload);
};

const listMemberships = async (filter = {}) => {
  return Membership.find(filter).populate("user");
};

const findMembershipById = async (id) => {
  return Membership.findById(id).populate("user");
};

const updateMembershipById = async (id, update) => {
  return Membership.findByIdAndUpdate(id, update, { new: true });
};

module.exports = {
  createMembership,
  listMemberships,
  findMembershipById,
  updateMembershipById,
};
