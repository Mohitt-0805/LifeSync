/**
 * seed-runner.js — Standalone seed runner for real MongoDB.
 * Usage: npm run seed:learn
 *
 * For mock DB mode, seeding happens automatically at server startup.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Course } from "../src/models/Course.js";
import { Lesson } from "../src/models/Lesson.js";
import { seedFinancialLiteracy } from "./financialLiteracy.seed.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/lifesync";

async function main() {
  if (process.env.USE_MOCK_DB === "true") {
    console.log(
      "⚠️  USE_MOCK_DB=true — seeding happens automatically at server startup."
    );
    console.log(
      "    Start the server with `npm run dev` and the course will be seeded."
    );
    process.exit(0);
  }

  console.log(`\n🌱 Connecting to MongoDB at: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.\n");

  await seedFinancialLiteracy(Course, Lesson);

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected. Seed complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
