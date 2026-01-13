const express = require("express");

const membershipService = require("../services/membership.service");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { ROLES } = require("../utils/constants");
const { sendCreated, sendSuccess } = require("../utils/response");

const router = express.Router();

router.post(
  "/",
  auth,
  role([ROLES.ADMIN]),
  validate(["user", "plan", "startsAt", "endsAt"]),
  async (req, res, next) => {
    try {
      const membership = await membershipService.createMembership(req.body);
      return sendCreated(res, membership, "Membership created");
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @openapi
 * /memberships:
 *   get:
 *     tags:
 *       - Memberships
 *     summary: List memberships (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of memberships
 */
router.get("/", auth, role([ROLES.ADMIN]), async (req, res, next) => {
  try {
    const memberships = await membershipService.listMemberships();
    return sendSuccess(res, memberships);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /memberships/{id}:
 *   get:
 *     tags:
 *       - Memberships
 *     summary: Get membership by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membership details
 *       404:
 *         description: Membership not found
 */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const membership = await membershipService.getMembershipById(req.params.id);
    return sendSuccess(res, membership);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /memberships/{id}:
 *   patch:
 *     tags:
 *       - Memberships
 *     summary: Update membership (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Membership updated
 *       404:
 *         description: Membership not found
 */
router.patch(
  "/:id",
  auth,
  role([ROLES.ADMIN]),
  async (req, res, next) => {
    try {
      const membership = await membershipService.updateMembership(
        req.params.id,
        req.body
      );
      return sendSuccess(res, membership, "Membership updated");
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
