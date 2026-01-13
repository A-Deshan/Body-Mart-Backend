const logger = require("../utils/logger");

const sendEmail = async (to, subject, body) => {
  logger.info("Mock email sent", { to, subject, body });
  return { delivered: true };
};

const sendSms = async (to, message) => {
  logger.info("Mock SMS sent", { to, message });
  return { delivered: true };
};

module.exports = {
  sendEmail,
  sendSms,
};
