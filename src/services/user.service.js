const userDao = require("../daos/user.dao");

const listUsers = async () => {
  return userDao.listUsers();
};

const getUserById = async (id) => {
  const user = await userDao.findUserById(id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateUser = async (id, update) => {
  const user = await userDao.updateUserById(id, update);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

module.exports = {
  listUsers,
  getUserById,
  updateUser,
};
