const BASE = "http://localhost:5000/api/v1";

async function test() {
  console.log("--- Signup ---");
  const regRes = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tester Learn", email: "tester123@example.com", password: "password123" }),
  });
  const regData = await regRes.json();
  console.log("Signup response:", JSON.stringify(regData, null, 2));
}

test().catch(console.error);
