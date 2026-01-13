const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  if (meta) {
    return `[${timestamp}] [${level}] ${message} ${JSON.stringify(meta)}`;
  }
  return `[${timestamp}] [${level}] ${message}`;
};

const logger = {
  info: (message, meta) => console.log(formatMessage("INFO", message, meta)),
  warn: (message, meta) => console.warn(formatMessage("WARN", message, meta)),
  error: (message, meta) => console.error(formatMessage("ERROR", message, meta)),
};

module.exports = logger;
