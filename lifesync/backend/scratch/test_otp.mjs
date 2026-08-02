// Quick test of the OTP signup + verify pipeline
const BASE = "http://localhost:5000/api/v1";

async function testOtpPipeline() {
  const email = `testuser_${Date.now()}@example.com`;
  
  console.log("=== Step 1: Signup ===");
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email, password: "test123456" }),
  });
  const signupData = await signupRes.json();
  console.log("Status:", signupRes.status);
  console.log("Response:", JSON.stringify(signupData, null, 2));
  
  console.log("\n=== Step 2: Send OTP (login flow) ===");
  const sendOtpRes = await fetch(`${BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "Login Verification" }),
  });
  const sendOtpData = await sendOtpRes.json();
  console.log("Status:", sendOtpRes.status);
  console.log("Response:", JSON.stringify(sendOtpData, null, 2));
  
  console.log("\n=== Step 3: Resend OTP ===");
  const resendRes = await fetch(`${BASE}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "Verification" }),
  });
  const resendData = await resendRes.json();
  console.log("Status:", resendRes.status);
  console.log("Response:", JSON.stringify(resendData, null, 2));
  
  console.log("\n=== Step 4: Verify OTP with WRONG code ===");
  const verifyWrongRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: "000000" }),
  });
  const verifyWrongData = await verifyWrongRes.json();
  console.log("Status:", verifyWrongRes.status);
  console.log("Response:", JSON.stringify(verifyWrongData, null, 2));
  
  console.log("\n=== Step 5: Verify OTP with CORRECT code (needs manual OTP) ===");
  console.log("(Cannot auto-test this - need the OTP from server console/email)");
  
  console.log("\n=== DONE ===");
  console.log("Check the backend terminal for OTP console output to see if OTPs are being generated and logged.");
}

testOtpPipeline().catch(console.error);
