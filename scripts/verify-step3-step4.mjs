// scripts/verify-step3-step4.mjs
// Verifies Step 3 (Mandatory Re-Test) and Step 4 (Adaptive Roadmap) requirements

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log("================================================================");
  console.log("RUNNING ACCEPTANCE VERIFICATION FOR STEP 3 AND STEP 4 PIPELINE");
  console.log(`Target: ${BASE_URL}`);
  console.log("================================================================\n");

  // TEST 0: Invalid Session State vs Empty State
  console.log("--- TEST 0: Invalid Session State vs Empty State ---");
  const invalidSessionRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=invalid_session_99999`);
  const invalidSessionData = await invalidSessionRes.json();
  assert(invalidSessionData.sessionNotFound === true, "Invalid sessionId returns sessionNotFound: true on /api/adaptive-path");
  assert(invalidSessionData.requestedSessionId === "invalid_session_99999", "Preserves requestedSessionId");

  const invalidGraphRes = await fetch(`${BASE_URL}/api/graph?sessionId=invalid_session_99999`);
  const invalidGraphData = await invalidGraphRes.json();
  assert(invalidGraphData.sessionNotFound === true, "Invalid sessionId on /api/graph returns sessionNotFound: true");

  // TEST 1: Initialize Diagnostic Session (Step 1)
  console.log("\n--- TEST 1: Diagnostic Session Initialization ---");
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "SQL Transaction Isolation",
      question: "Why can READ COMMITTED return different values between two reads?",
      answer: "The transaction should keep one fixed snapshot.",
      responseType: "written",
    }),
  });
  const analyzeData = await analyzeRes.json();
  assert(analyzeData.success === true, "Diagnostic analysis succeeded");
  const sessionId = analyzeData.sessionId;
  assert(sessionId && sessionId.startsWith("diag_"), `Valid sessionId generated: ${sessionId}`);
  console.log(`  Session ID: ${sessionId}`);

  // TEST 2: Cognitive Bisect (Step 2)
  console.log("\n--- TEST 2: Bisect Verification ---");
  const bisectRes = await fetch(`${BASE_URL}/api/bisect?sessionId=${sessionId}`);
  const bisectData = await bisectRes.json();
  assert(bisectData.hasActiveSession === true, "Active session detected in bisect");
  assert(bisectData.session != null, "Bisect session object returned");
  const targetConceptId = bisectData.session.targetConceptId;
  assert(targetConceptId != null, `Target concept isolated: ${targetConceptId}`);
  if (bisectData.currentProbe) {
    console.log(`  Initial Probe: "${bisectData.currentProbe.question}" (Concept: ${bisectData.currentProbe.conceptId})`);
  }

  // TEST 3: Recovery & Re-Test Data Loading (Step 3)
  console.log("\n--- TEST 3: Recovery / Re-Test Data Retrieval ---");
  const recoveryRes = await fetch(`${BASE_URL}/api/recovery?sessionId=${sessionId}`);
  const recoveryData = await recoveryRes.json();
  assert(recoveryData.success === true, "Recovery endpoint returned success");
  assert(recoveryData.concept != null, `Recovery concept identified: ${recoveryData.concept.name} (${recoveryData.concept.id})`);
  assert(recoveryData.intervention != null, "Intervention module loaded");
  assert(recoveryData.retest != null, "Re-test assessment generated");

  const rootConceptId = recoveryData.concept.id;
  const reTestQ = recoveryData.retest;
  assert(Array.isArray(reTestQ.options) && reTestQ.options.length >= 2, "Re-test has multiple choice options");
  const correctOpt = reTestQ.options.find(o => o.isCorrect === true);
  const incorrectOpt = reTestQ.options.find(o => o.isCorrect === false);
  assert(correctOpt != null, `Correct option identified: ${correctOpt.id} ("${correctOpt.text.substring(0, 45)}...")`);
  assert(incorrectOpt != null, `Incorrect option identified: ${incorrectOpt.id} ("${incorrectOpt.text.substring(0, 45)}...")`);

  // TEST 4: Step 3 Validation - Empty Submission (Requirement: "Please select an answer.")
  console.log("\n--- TEST 4: Empty Re-Test Submission Validation ---");
  const emptyRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      conceptId: rootConceptId,
      selectedOptionId: "",
    }),
  });
  const emptyData = await emptyRes.json();
  assert(emptyRes.status === 400 || emptyData.success === false, "Empty submission rejected by API");
  assert(emptyData.error === "Please select an answer.", `Returns exact message: "Please select an answer." (got: "${emptyData.error}")`);

  // Also test missing selectedOptionId entirely
  const missingRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      conceptId: rootConceptId,
    }),
  });
  const missingData = await missingRes.json();
  assert(missingData.error === "Please select an answer.", "Missing selectedOptionId returns 'Please select an answer.'");

  // TEST 5: Step 3 - Incorrect Answer Submission
  console.log("\n--- TEST 5: Incorrect Re-Test Submission ---");
  const incorrectRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      conceptId: rootConceptId,
      selectedOptionId: incorrectOpt.id,
    }),
  });
  const incorrectData = await incorrectRes.json();
  assert(incorrectData.success === true, "Incorrect answer evaluated");
  assert(incorrectData.isCorrect === false, "isCorrect is false");
  assert(incorrectData.status === "unresolved", "Status is marked 'unresolved'");
  assert(incorrectData.feedback != null, "Detailed feedback returned for incorrect answer");

  // Verify learner model NOT recovered after incorrect answer
  const prePathRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=${sessionId}`);
  const prePathData = await prePathRes.json();
  assert(prePathData.session.recoveryCompleted === false, "Session recoveryCompleted is FALSE after incorrect re-test");
  assert(prePathData.metrics.recoveredCount === 0, "Recovered count is 0 after incorrect re-test");

  // TEST 6: Step 3 - Correct Answer Submission
  console.log("\n--- TEST 6: Correct Re-Test Submission ---");
  const correctRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      conceptId: rootConceptId,
      selectedOptionId: correctOpt.id,
    }),
  });
  const correctData = await correctRes.json();
  assert(correctData.success === true, "Correct answer evaluated");
  assert(correctData.isCorrect === true, "isCorrect is true");
  assert(correctData.status === "recovered", "Status is marked 'recovered'");

  // TEST 7: Step 4 - Adaptive Path & Progress Verification
  console.log("\n--- TEST 7: Step 4 Adaptive Path & Progress Verification ---");
  const step4Res = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=${sessionId}`);
  const step4Data = await step4Res.json();
  assert(step4Data.success === true, "Adaptive path API returns success");
  assert(!step4Data.isEmpty, "Adaptive path is NOT empty");
  assert(step4Data.hasSessions === true, "hasSessions is true");
  assert(step4Data.sessionNotFound === false || !step4Data.sessionNotFound, "sessionNotFound is false");

  // Verify completed session card data
  assert(step4Data.session != null, "Completed diagnostic session returned");
  assert(step4Data.session.id === sessionId, "Session ID matches");
  assert(step4Data.session.topic === "SQL Transaction Isolation", "Session topic matches");
  assert(step4Data.session.recoveryCompleted === true, "Session recoveryCompleted is true");
  assert(step4Data.session.rootGap != null, `Root gap identified: ${step4Data.session.rootGap}`);
  console.log(`  Session recovered status: ${step4Data.session.recoveryCompleted}`);
  console.log(`  Root gap concept: ${step4Data.session.rootGap}`);

  // Verify metrics
  assert(step4Data.metrics != null, "Metrics object present");
  assert(step4Data.metrics.recoveredCount >= 1, `Recovered count is at least 1 (got: ${step4Data.metrics.recoveredCount})`);
  console.log(`  Recovered count: ${step4Data.metrics.recoveredCount}`);

  // Verify adaptive path items
  assert(Array.isArray(step4Data.adaptivePath) && step4Data.adaptivePath.length > 0, "Adaptive path populated with sequence");
  console.log(`  Adaptive path steps count: ${step4Data.adaptivePath.length}`);

  // TEST 8: Verify Step 4 Graph with Session ID
  console.log("\n--- TEST 8: Step 4 DAG Graph Data Verification ---");
  const graphRes = await fetch(`${BASE_URL}/api/graph?sessionId=${sessionId}`);
  const graphData = await graphRes.json();
  assert(graphData.concepts.length > 0, `Graph concepts populated (${graphData.concepts.length} nodes)`);
  assert(graphData.sessionNotFound !== true, "Graph does not report sessionNotFound");

  // TEST 9: Verify Session Preservation on Refresh
  console.log("\n--- TEST 9: Refresh Step 4 (Repeated Request) ---");
  const refreshRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=${sessionId}`);
  const refreshData = await refreshRes.json();
  assert(refreshData.session.id === sessionId, "Session remains intact after refresh");
  assert(refreshData.session.recoveryCompleted === true, "Recovery state persists across requests");

  console.log("\n================================================================");
  console.log("🎉 ALL STEP 3 AND STEP 4 ACCEPTANCE TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================");
}

runVerification().catch(err => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
