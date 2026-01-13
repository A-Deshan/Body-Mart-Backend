const sendSuccess = (res, data, message = "OK") => {
  return res.status(200).json({ success: true, message, data });
};

const sendCreated = (res, data, message = "Created") => {
  return res.status(201).json({ success: true, message, data });
};

const sendError = (res, statusCode, message, errors) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
};
