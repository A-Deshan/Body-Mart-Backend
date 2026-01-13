const mongoose = require("mongoose");

require("dotenv").config();
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection error", error);
    throw error;
  }
};

module.exports = connectDB;
