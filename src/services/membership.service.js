const membershipDao = require("../daos/membership.dao");

const createMembership = async (payload) => {
  return membershipDao.createMembership(payload);
};

const listMemberships = async (filter = {}) => {
  return membershipDao.listMemberships(filter);
};

const getMembershipById = async (id) => {
  const membership = await membershipDao.findMembershipById(id);
  if (!membership) {
    const error = new Error("Membership not found");
    error.statusCode = 404;
    throw error;
  }
  return membership;
};

const updateMembership = async (id, update) => {
  const membership = await membershipDao.updateMembershipById(id, update);
  if (!membership) {
    const error = new Error("Membership not found");
    error.statusCode = 404;
    throw error;
  }
  return membership;
};

module.exports = {
  createMembership,
  listMemberships,
  getMembershipById,
  updateMembership,
};
