const express = require("express");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const { connectDB } = require("./config");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");
const logger = require("./utils/logger");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
