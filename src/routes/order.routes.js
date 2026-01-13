const express = require("express");

const orderService = require("../services/order.service");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { ROLES } = require("../utils/constants");
const { sendCreated, sendSuccess } = require("../utils/response");

const router = express.Router();

router.post("/", auth, validate(["items"]), async (req, res, next) => {
  try {
    const order = await orderService.createOrder({
      user: req.user.id,
      items: req.body.items,
    });
    return sendCreated(res, order, "Order created");
  } catch (error) {
    return next(error);
  }
});

router.get("/", auth, async (req, res, next) => {
  try {
    const filter = req.user.role === ROLES.ADMIN ? {} : { user: req.user.id };
    const orders = await orderService.listOrders(filter);
    return sendSuccess(res, orders);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", auth, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return sendSuccess(res, order);
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:id/status",
  auth,
  role([ROLES.ADMIN]),
  validate(["status"]),
  async (req, res, next) => {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status
      );
      return sendSuccess(res, order, "Order updated");
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
