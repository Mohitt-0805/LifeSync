/**
 * Quick diagnostic script — tests the Learn API with an authenticated user.
 * Since we're using mock DB, we register, manually verify the user in-memory,
 * then log in to get a JWT token.
 */

const BASE = "http://localhost:5000/api/v1";

async function test() {
  // Step 1: Register
  console.log("--- Step 1: Register ---");
  const regRes = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Learn Tester", email: "learntester@test.com", password: "password123" }),
  });
  const regData = await regRes.json();
  console.log("Register status:", regRes.status, regData.message);

  // Step 2: Get the OTP from send-otp (in mock DB mode the OTP is stored in memory)
  // We can use the verify-otp endpoint; but we need the OTP value.
  // Since mock DB logs OTP to console, let's try calling the send-otp endpoint
  // and then try common workarounds. Actually, we can just bypass and login directly
  // since the user exists now. But they aren't verified yet.
  
  // In mock DB mode, the OTP is logged. Let's try to brute force our way:
  // Actually, let's look at a smarter approach — use send-otp with login purpose, 
  // which creates/finds the user and stores OTP. Then we need to retrieve it.

  // Step 2b: Since we can't easily get the OTP from console in this script,
  // let's try a direct POST to the test-email dev endpoint to see if the
  // Learn API data itself is the issue, or if it's an auth issue.

  // Try getting courses WITHOUT auth to confirm the 401:
  console.log("\n--- Step 2: Test /courses without auth ---");
  const noAuthRes = await fetch(`${BASE}/courses`);
  console.log("Status:", noAuthRes.status);
  const noAuthData = await noAuthRes.json();
  console.log("Response:", noAuthData.message);

  // Now let's check what's in the mock DB store directly via a dev endpoint
  console.log("\n--- Step 3: Check mock DB courses via health endpoint ---");
  const healthRes = await fetch("http://localhost:5000/health");
  console.log("Server health:", (await healthRes.json()).status);

  // Let's try the Vite dev proxy approach - the frontend uses /api/v1 base
  // With the Vite proxy, the frontend sends to localhost:5173/api/v1/courses
  // Check if vite proxy is set up:
  console.log("\n--- Step 4: Test via Vite proxy ---");
  try {
    const viteRes = await fetch("http://localhost:5173/api/v1/courses");
    console.log("Vite proxy status:", viteRes.status);
  } catch (err) {
    console.log("Vite proxy error:", err.message);
  }
}

test().catch(console.error);
