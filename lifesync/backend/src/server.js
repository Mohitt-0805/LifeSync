import "dotenv/config";
import connectDB from "./config/db.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    // Auto-seed financial literacy course in mock DB mode
    if (process.env.USE_MOCK_DB === "true") {
      const { Course } = await import("./models/Course.js");
      const { Lesson } = await import("./models/Lesson.js");
      const { seedFinancialLiteracy } = await import("../seeds/financialLiteracy.seed.js");
      await seedFinancialLiteracy(Course, Lesson);
    }

    // Initialize scheduled cron jobs
    const { initDeadlineReminderCron } = await import("./cron/deadlineReminder.cron.js");
    initDeadlineReminderCron();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`⚙️ Server is running and listening at 0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database connection / initialization failed !!! ", err);
  });

