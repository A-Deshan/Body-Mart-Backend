const jwt = require("jsonwebtoken");

const jwtConfig = require("../config/jwt");

const signToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

module.exports = {
  signToken,
  verifyToken,
};
