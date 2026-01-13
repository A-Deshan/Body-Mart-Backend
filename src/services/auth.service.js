const userDao = require("../daos/user.dao");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/token");
const { ROLES } = require("../utils/constants");

const register = async (payload) => {
  const existing = await userDao.findUserByEmail(payload.email);
  if (existing) {
    const error = new Error("Email already in use");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await userDao.createUser({
    name: payload.name,
    email: payload.email,
    password: passwordHash,
    role: payload.role || ROLES.USER,
    phone: payload.phone,
  });

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  const userData = user.toObject();
  delete userData.password;
  return { user: userData, token };
};

const login = async (email, password) => {
  const user = await userDao.findUserByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const matches = await comparePassword(password, user.password);
  if (!matches) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  const userData = user.toObject();
  delete userData.password;
  return { user: userData, token };
};

module.exports = {
  register,
  login,
};
