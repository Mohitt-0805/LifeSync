import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";

const router = Router();

// Validation Rules
const signupRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginRules = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordRules = [
  body("email").isEmail().withMessage("Invalid email address"),
];

const resetPasswordRules = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Public Routes
router.post("/signup", signupRules, validate, registerUser);
router.post("/login", loginRules, validate, loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordRules, validate, resetPassword);

// Protected Routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/profile", verifyJWT, getUserProfile);
router.put("/profile", verifyJWT, updateUserProfile);

export default router;
