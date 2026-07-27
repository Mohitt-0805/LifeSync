import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = Router();

// Secure all note endpoints
router.use(verifyJWT);

const noteValidationRules = [
  body("title").optional().trim(),
  body("content").optional(),
  body("folder").optional().trim(),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

router.route("/")
  .post(noteValidationRules, validate, createNote)
  .get(getNotes);

router.route("/:id")
  .put(updateNote)
  .delete(deleteNote);

export default router;
