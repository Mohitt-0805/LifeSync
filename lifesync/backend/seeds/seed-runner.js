/**
 * seed-runner.js — Standalone seed runner for real MongoDB.
 * Usage: npm run seed:learn
 *
 * For mock DB mode, seeding happens automatically at server startup.
 */
import "dotenv/config";
import connectDB from "../src/config/db.js";
import { Course } from "../src/models/Course.js";
import { Lesson } from "../src/models/Lesson.js";
import { seedFinancialLiteracy } from "./financialLiteracy.seed.js";

async function main() {
  console.log(`\n🌱 Initializing database connection...`);
  await connectDB();

  await seedFinancialLiteracy(Course, Lesson);
  console.log("\n🌱 Seed complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
