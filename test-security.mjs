// Dedicated Security & Cryptographic Authentication Test for ARCHAIA

async function runSecurityTests() {
  console.log("=== ARCHAIA CRYPTOGRAPHIC SECURITY & AUTH TEST ===\n");
  const baseUrl = "http://localhost:3000";

  // Test 1: Successful Login with Valid Seed Credentials
  console.log("1. Testing valid student login (student@college.edu)...");
  const validRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@college.edu",
      password: "Archaia2026!",
    }),
  });
  const validData = await validRes.json();
  if (!validData.success || !validData.token) throw new Error("Valid login failed");
  console.log(`✓ Login Successful! Authenticated as: ${validData.user.fullName} (${validData.user.role})`);
  console.log(`✓ Signed HMAC-SHA256 Token: ${validData.token.substring(0, 35)}...`);

  // Test 2: Invalid Password Detection
  console.log("\n2. Testing invalid password rejection...");
  const invalidRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@college.edu",
      password: "WrongPassword123!",
    }),
  });
  const invalidData = await invalidRes.json();
  if (invalidRes.status !== 401) throw new Error("Expected 401 for wrong password");
  console.log(`✓ Wrong password rejected (HTTP 401): "${invalidData.error}"`);
  console.log(`✓ Attempts remaining before security lockout: ${invalidData.attemptsLeft}`);

  // Test 3: Session Validation via Cookie/Header
  console.log("\n3. Testing active session verification (/api/auth/session)...");
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Authorization: `Bearer ${validData.token}` },
  });
  const sessionData = await sessionRes.json();
  if (!sessionData.authenticated) throw new Error("Session token verification failed");
  console.log(`✓ Session Token Verified! Active user: ${sessionData.user.email} (${sessionData.user.fullName})`);

  // Test 4: Forged/Tampered Token Rejection
  console.log("\n4. Testing forged token detection...");
  const forgedToken = validData.token.substring(0, validData.token.length - 8) + "TAMPERED";
  const forgedRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  const forgedData = await forgedRes.json();
  if (forgedData.authenticated) throw new Error("Tampered token was accepted!");
  console.log(`✓ Security Guard: Tampered HMAC signature rejected: "${forgedData.error}"`);

  // Test 5: Registration with Password Strength Enforcement
  console.log("\n5. Testing learner profile registration with password strength check...");
  const weakPassRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "new_learner@mit.edu",
      password: "123", // Weak password
      fullName: "Jane Doe",
    }),
  });
  const weakData = await weakPassRes.json();
  if (weakPassRes.status !== 400) throw new Error("Weak password should be rejected");
  console.log(`✓ Weak password rejected: "${weakData.error}"`);

  // Strong password registration
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "jane_doe@mit.edu",
      password: "SuperSecret2026!Password",
      fullName: "Jane Doe",
    }),
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error("Strong registration failed: " + regData.error);
  console.log(`✓ New Learner Registered & Authenticated: ${regData.user.fullName} (${regData.user.email})`);

  console.log("\n=== ALL CRYPTOGRAPHIC SECURITY TESTS PASSED 100%! ===");
}

runSecurityTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
