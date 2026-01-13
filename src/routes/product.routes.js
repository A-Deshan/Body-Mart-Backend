const express = require("express");

const productService = require("../services/product.service");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { ROLES } = require("../utils/constants");
const { sendCreated, sendSuccess } = require("../utils/response");

const router = express.Router();


router.get("/", async (req, res, next) => {
  try {
    const products = await productService.listProducts();
    return sendSuccess(res, products);
  } catch (error) {
    return next(error);
  }
});


router.get("/:id", async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, product);
  } catch (error) {
    return next(error);
  }
});


router.post(
  "/",
  auth,
  role([ROLES.ADMIN]),
  validate(["name", "price"]),
  async (req, res, next) => {
    try {
      const product = await productService.createProduct(req.body);
      return sendCreated(res, product, "Product created");
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  "/:id",
  auth,
  role([ROLES.ADMIN]),
  async (req, res, next) => {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, product, "Product updated");
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:id",
  auth,
  role([ROLES.ADMIN]),
  async (req, res, next) => {
    try {
      const product = await productService.deleteProduct(req.params.id);
      return sendSuccess(res, product, "Product deleted");
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
