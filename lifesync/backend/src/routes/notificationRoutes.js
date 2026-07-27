import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
  .get(getNotifications)
  .put(markAllAsRead);

router.route("/:id")
  .put(markAsRead)
  .delete(deleteNotification);

export default router;
