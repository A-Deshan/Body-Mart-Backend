const logger = require("../utils/logger");

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(message, { stack: err.stack });

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
