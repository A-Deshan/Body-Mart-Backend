const express = require("express");

const userService = require("../services/user.service");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { ROLES } = require("../utils/constants");
const { sendSuccess } = require("../utils/response");

const router = express.Router();

router.get("/", auth, role([ROLES.ADMIN]), async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    return sendSuccess(res, users);
  } catch (error) {
    return next(error);
  }
});


router.get("/:id", auth, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user);
  } catch (error) {
    return next(error);
  }
});


router.patch(
  "/:id",
  auth,
  validate(["name"]),
  async (req, res, next) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return sendSuccess(res, user, "User updated");
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
