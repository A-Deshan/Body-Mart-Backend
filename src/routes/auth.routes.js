const express = require("express");

const authService = require("../services/auth.service");
const validate = require("../middleware/validate.middleware");
const { sendCreated, sendSuccess } = require("../utils/response");

const router = express.Router();

router.post(
  "/register",
  validate(["name", "email", "password"]),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      return sendCreated(res, result, "Registration successful");
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/login",
  validate(["email", "password"]),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      return sendSuccess(res, result, "Login successful");
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
