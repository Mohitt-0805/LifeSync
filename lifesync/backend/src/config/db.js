import { supabase, isSupabaseConfigured } from "./supabase.js";

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === "true") {
    console.log(`\n⚠️  Running in Mock DB mode (no external database required)`);
    return;
  }

  if (!isSupabaseConfigured()) {
    console.warn(`\n⚠️  Supabase URL/Key not configured in environment. Defaulting to in-memory mode.`);
    return;
  }

  try {
    const connectionPromise = supabase.from("users").select("id").limit(1);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase connection check timed out after 4 seconds")), 4000)
    );
    const { error } = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (error && error.code !== "PGRST116" && !error.message?.includes("0 rows")) {
      console.warn(`⚠️  Supabase table warning (schema may need initialization): ${error.message}`);
    }
    console.log(`\n⚡ Connected to Supabase PostgreSQL Cloud Database!`);
  } catch (error) {
    console.error("❌ Supabase connection check failed (defaulting to offline or error handling): ", error.message || error);
  }
};

export default connectDB;
