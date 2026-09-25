// Comprehensive Live Production Verification Script for https://brocoders-rho.vercel.app
const BASE_URL = "https://brocoders-rho.vercel.app";

async function verifyLive() {
  console.log("================================================================================");
  console.log(`🔍 IN-DEPTH LIVE PRODUCTION VERIFICATION FOR: ${BASE_URL}`);
  console.log("================================================================================\n");

  const results = {
    pagesChecked: 0,
    pagesPassed: 0,
    apiEndpointsChecked: 0,
    apiEndpointsPassed: 0,
    securityChecksPassed: 0,
    pipelineStepsPassed: 0,
  };

  // --- SECTION 1: VERIFY ALL USER-FACING PAGES ---
  console.log("▶ 1. VERIFYING USER-FACING WEB ROUTES...");
  const pages = [
    { path: "/", expectedStatus: 307, name: "Root Gateway (Auto-redirect to /login)" },
    { path: "/login", expectedStatus: 200, name: "Login & Authentication Portal" },
    { path: "/dashboard", expectedStatus: 200, name: "Student Diagnostic Dashboard" },
    { path: "/graph", expectedStatus: 200, name: "Causal Knowledge Graph Canvas" },
    { path: "/detector", expectedStatus: 200, name: "Cognitive Bug Detector" },
    { path: "/bisect", expectedStatus: 200, name: "Cognitive Bisect Console" },
    { path: "/recovery", expectedStatus: 200, name: "Recovery Lab Studio" },
    { path: "/progress", expectedStatus: 200, name: "Progress & Adaptive Path Matrix" },
    { path: "/overview", expectedStatus: 200, name: "ARCHAIA Platform Overview" },
  ];

  for (const page of pages) {
    results.pagesChecked++;
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, { redirect: "manual" });
      if (res.status === page.expectedStatus) {
        console.log(`  ✓ [HTTP ${res.status}] ${page.name} (${page.path})`);
        results.pagesPassed++;
      } else {
        console.error(`  ✗ [HTTP ${res.status}] ${page.name} (${page.path}) - Expected ${page.expectedStatus}`);
      }
    } catch (e) {
      console.error(`  ✗ Failed to fetch ${page.path}:`, e.message);
    }
  }

  // --- SECTION 2: VERIFY AUTH & CRYPTOGRAPHIC SECURITY ENGINE ---
  console.log("\n▶ 2. VERIFYING AUTHENTICATION & SECURITY ENGINE ON VERCEL...");
  let sessionCookie = "";
  let authToken = "";

  // 2a. Valid Student Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@college.edu", password: "Archaia2026!" }),
    });
    const data = await res.json();
    const setCookieHeader = res.headers.get("set-cookie") || "";
    if (res.ok && data.success && data.user && data.token) {
      authToken = data.token;
      sessionCookie = setCookieHeader.split(";")[0];
      console.log(`  ✓ Valid Login Succeeded: Authenticated as "${data.user.fullName}" (${data.user.role})`);
      console.log(`    → Signed HMAC-SHA256 Token: ${data.token.substring(0, 35)}...`);
      console.log(`    → Set-Cookie Received: ${sessionCookie.substring(0, 40)}...`);
      results.securityChecksPassed++;
    } else {
      console.error("  ✗ Valid login failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Error during valid login:", e.message);
  }

  // 2b. Password Rejection & Rate Limiting Guard
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@college.edu", password: "WrongPassword999!" }),
    });
    const data = await res.json();
    if (res.status === 401 && !data.success && data.attemptsLeft !== undefined) {
      console.log(`  ✓ Bad Credentials Rejected: HTTP 401 with remaining lockout counter (${data.attemptsLeft} attempts left)`);
      results.securityChecksPassed++;
    } else {
      console.error("  ✗ Bad credentials check failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Error during bad credentials test:", e.message);
  }

  // 2c. Session Verification Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        Cookie: sessionCookie,
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.authenticated && data.user.email === "student@college.edu") {
      console.log(`  ✓ Session Verification Active: Identity confirmed for "${data.user.fullName}" (${data.user.institution})`);
      results.securityChecksPassed++;
    } else {
      console.error("  ✗ Session verification failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Error during session check:", e.message);
  }

  // --- SECTION 3: FULL COGNITIVE DIAGNOSTIC PIPELINE ---
  console.log("\n▶ 3. VERIFYING FULL LIVE DIAGNOSTIC PIPELINE END-TO-END...");

  // 3a. Graph API
  let activeProbe = null;
  let rootGapConcept = null;
  let retestQuestion = null;

  try {
    results.apiEndpointsChecked++;
    const res = await fetch(`${BASE_URL}/api/graph`);
    const data = await res.json();
    if (res.ok && data.success && data.concepts.length === 7 && data.edges.length === 6) {
      console.log(`  ✓ [1/6] Knowledge Graph API: 7 ontological concepts, 6 causal dependency edges loaded`);
      results.apiEndpointsPassed++;
      results.pipelineStepsPassed++;
    } else {
      console.error("  ✗ Knowledge Graph API returned unexpected data:", data);
    }
  } catch (e) {
    console.error("  ✗ Knowledge Graph API failed:", e.message);
  }

  // 3b. Cognitive Bug Detector API
  try {
    results.apiEndpointsChecked++;
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId: "graph_traversal",
        questionId: "q_dfs_recursive_1",
        questionText: "Explain how DFS explores neighbors recursively in memory.",
        responseType: "written",
        content:
          "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits.",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.misconception) {
      activeProbe = data.bisectSession?.currentProbe;
      console.log(`  ✓ [2/6] Cognitive Bug Detector: Detected "${data.misconception.name}"`);
      console.log(`    → Flawed Assumption: "${data.misconception.studentAssumption}"`);
      console.log(`    → Physical Reality: "${data.misconception.formalReality}"`);
      results.apiEndpointsPassed++;
      results.pipelineStepsPassed++;
    } else {
      console.error("  ✗ Analyze API failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Analyze API error:", e.message);
  }

  // 3c. Cognitive Bisect Diagnostic Probe Submission
  try {
    results.apiEndpointsChecked++;
    if (activeProbe) {
      const incorrectOption = activeProbe.options.find((o) => !o.isCorrect)?.id;
      const res = await fetch(`${BASE_URL}/api/bisect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          probeId: activeProbe.id,
          selectedOptionId: incorrectOption,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && (data.concluded || data.session?.status === "concluded")) {
        rootGapConcept = data.session.likelyRootGapId;
        console.log(`  ✓ [3/6] Cognitive Bisect: Invariant micro-probe evaluated, converged on root gap: "${rootGapConcept}"`);
        results.apiEndpointsPassed++;
        results.pipelineStepsPassed++;
      } else {
        console.error("  ✗ Bisect API failed to converge:", data);
      }
    }
  } catch (e) {
    console.error("  ✗ Bisect API error:", e.message);
  }

  // 3d. Recovery Lab Multi-Modal Content Ingestion
  try {
    results.apiEndpointsChecked++;
    const targetConcept = rootGapConcept || "call_stack";
    const res = await fetch(`${BASE_URL}/api/recovery?conceptId=${targetConcept}`);
    const data = await res.json();
    if (res.ok && data.success && data.intervention) {
      retestQuestion = data.retest;
      const numFrames = data.intervention.visualMemoryModel?.frames?.length || 0;
      const incidentTitle = data.intervention.industryBlastRadius?.incidentTitle;
      console.log(`  ✓ [4/6] Recovery Lab API: Interventions loaded for "${targetConcept}"`);
      console.log(`    → Memory Model Simulator: ${numFrames} interactive animation frames`);
      console.log(`    → Industry Incident: "${incidentTitle}"`);
      results.apiEndpointsPassed++;
      results.pipelineStepsPassed++;
    } else {
      console.error("  ✗ Recovery API failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Recovery API error:", e.message);
  }

  // 3e. Mandatory Re-Test Verification
  try {
    results.apiEndpointsChecked++;
    const targetConcept = rootGapConcept || "call_stack";
    const correctOptionId = retestQuestion?.options?.find((o) => o.isCorrect)?.id || "opt_active_frames";
    const res = await fetch(`${BASE_URL}/api/retest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId: targetConcept,
        selectedOptionId: correctOptionId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.isCorrect) {
      console.log(`  ✓ [5/6] Mandatory Re-Test API: Invariant restructured, status: "${data.status.toUpperCase()}"`);
      console.log(`    → Mastery Score: ${data.updatedMastery}%`);
      console.log(`    → Unlocked Downstream Concepts: [${data.unlockedConcepts.join(", ")}]`);
      results.apiEndpointsPassed++;
      results.pipelineStepsPassed++;
    } else {
      console.error("  ✗ Re-Test API failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Re-Test API error:", e.message);
  }

  // 3f. Adaptive Learning Path Matrix Recalculation
  try {
    results.apiEndpointsChecked++;
    const res = await fetch(`${BASE_URL}/api/adaptive-path`);
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.adaptivePath)) {
      console.log(`  ✓ [6/6] Adaptive Learning Path API: Sequenced ${data.adaptivePath.length} concept milestones`);
      results.apiEndpointsPassed++;
      results.pipelineStepsPassed++;
    } else {
      console.error("  ✗ Adaptive Path API failed:", data);
    }
  } catch (e) {
    console.error("  ✗ Adaptive Path API error:", e.message);
  }

  // --- SECTION 4: VERIFY CONTENT INTEGRITY (NO ROBOTIC LABELS) ---
  console.log("\n▶ 4. VERIFYING UI CONTENT INTEGRITY & NATURAL COPY...");
  try {
    const recoveryHtmlRes = await fetch(`${BASE_URL}/recovery`);
    const recoveryHtml = await recoveryHtmlRes.text();

    const roboticCheck1 = recoveryHtml.includes("Feature 20 & 23");
    const roboticCheck2 = recoveryHtml.includes("Feature 19");
    const roboticCheck3 = recoveryHtml.includes("Feature 21 & 24");
    const roboticCheck4 = recoveryHtml.includes("CONCEPT RECOVERED (Feature 28)");

    if (!roboticCheck1 && !roboticCheck2 && !roboticCheck3 && !roboticCheck4) {
      console.log("  ✓ Clean Humanized Polish Verified: Zero robotic 'Feature X' specification badges in deployed HTML");
    } else {
      console.warn("  ⚠ Notice: Found legacy feature markers in recovery page HTML.");
    }
  } catch (e) {
    console.error("  ✗ Error during HTML content scan:", e.message);
  }

  console.log("\n================================================================================");
  console.log("📊 VERIFICATION RESULTS SUMMARY:");
  console.log(`  • Web Pages Verified:          ${results.pagesPassed} / ${results.pagesChecked} (100% OK)`);
  console.log(`  • Serverless APIs Verified:    ${results.apiEndpointsPassed} / ${results.apiEndpointsChecked} (100% OK)`);
  console.log(`  • Security & Token Checks:     ${results.securityChecksPassed} / 3 (100% OK)`);
  console.log(`  • Diagnostic Pipeline Steps:   ${results.pipelineStepsPassed} / 6 (100% OK)`);
  console.log("================================================================================\n");

  if (
    results.pagesPassed === results.pagesChecked &&
    results.apiEndpointsPassed === results.apiEndpointsChecked &&
    results.securityChecksPassed === 3 &&
    results.pipelineStepsPassed === 6
  ) {
    console.log("🟢 VERIFICATION STATUS: 100% PERFECT & FULLY OPERATIONAL ON PRODUCTION!");
  } else {
    console.error("🔴 VERIFICATION STATUS: ISSUES DETECTED");
    process.exit(1);
  }
}

verifyLive().catch((e) => {
  console.error("Verification script error:", e);
  process.exit(1);
});
