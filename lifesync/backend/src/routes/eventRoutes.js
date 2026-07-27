import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = Router();

// Secure all event endpoints
router.use(verifyJWT);

const eventValidationRules = [
  body("title").trim().notEmpty().withMessage("Event title is required"),
  body("startDate").isISO8601().toDate().withMessage("Invalid start date format"),
  body("endDate").isISO8601().toDate().withMessage("Invalid end date format"),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
];

router.route("/")
  .post(eventValidationRules, validate, createEvent)
  .get(getEvents);

router.route("/:id")
  .put(updateEvent)
  .delete(deleteEvent);

export default router;
