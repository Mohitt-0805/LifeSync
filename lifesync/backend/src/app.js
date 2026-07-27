import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        !process.env.FRONTEND_URL ||
        origin === process.env.FRONTEND_URL ||
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Import and use routes
import authRouter from "./routes/authRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import goalRouter from "./routes/goalRoutes.js";
import habitRouter from "./routes/habitRoutes.js";
import expenseRouter from "./routes/expenseRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import noteRouter from "./routes/noteRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import achievementRouter from "./routes/achievementRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import learnRouter from "./routes/learnRoutes.js";

import devRouter from "./routes/devRoutes.js";

import calendarRouter from "./routes/calendarRoutes.js";

import classRouter from "./routes/classRoutes.js";
import focusRouter from "./routes/focusRoutes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/goals", goalRouter);
app.use("/api/v1/habits", habitRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/activities", activityRouter);
app.use("/api/v1/achievements", achievementRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/v1/classes", classRouter);
app.use("/api/v1/focus", focusRouter);
app.use("/api/v1", learnRouter);
app.use("/api/dev", devRouter);
app.use("/api/v1/dev", devRouter);

// Error middleware
app.use(errorMiddleware);

export { app };
