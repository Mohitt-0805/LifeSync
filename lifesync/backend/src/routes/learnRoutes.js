import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getCourses,
  getCourseById,
  getLessonById,
  completeLesson,
} from "../controllers/learnController.js";

const router = Router();

// All learn routes require authentication
router.use(verifyJWT);

// Courses
router.route("/courses").get(getCourses);
router.route("/courses/:courseId").get(getCourseById);

// Lessons
router.route("/lessons/:lessonId").get(getLessonById);
router.route("/lessons/:lessonId/complete").post(completeLesson);

export default router;
