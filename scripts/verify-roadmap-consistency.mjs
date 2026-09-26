const BASE_URL = process.env.TARGET_URL || "https://brocoders-rho.vercel.app";

async function run() {
  console.log("===============================================================================");
  console.log(" ARCHAIA ADAPTIVE ROADMAP REFRESH-CONSISTENCY VERIFICATION SUITE");
  console.log(` Target: ${BASE_URL}`);
  console.log("===============================================================================\n");

  let passes = 0;
  let total = 0;

  function assert(title, condition, detail = "") {
    total++;
    if (condition) {
      passes++;
      console.log(`✅ [PASS] ${title}${detail ? " -> " + detail : ""}`);
    } else {
      console.error(`❌ [FAIL] ${title}${detail ? " -> " + detail : ""}`);
    }
  }

  // 1. Reset demo state
  const resetRes = await fetch(`${BASE_URL}/api/demo/reset`, { method: "POST" });
  assert("1. Demo State Reset", resetRes.ok);

  // 2. Step 1 Detector Analysis
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "demo_dfs",
      topic: "Graph Traversal (DFS)",
      conceptId: "graph_traversal",
      question:
        "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?",
      answer:
        "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3.",
      responseType: "written",
    }),
  });
  const analyzeData = await analyzeRes.json();
  assert(
    "2. Step 1 Detector Analysis",
    analyzeData.success && analyzeData.sessionId === "demo_dfs" && analyzeData.hasMisconception,
    `Session: ${analyzeData.sessionId}, Misconception: ${analyzeData.misconception?.name}`
  );

  // 3. Step 2 Cognitive Bisect Probe & Answer
  const bisectStartRes = await fetch(`${BASE_URL}/api/bisect?sessionId=demo_dfs`);
  const bisectStartData = await bisectStartRes.json();
  const probeId = bisectStartData.currentProbe?.id || "probe_call_stack_frames";

  const bisectAnsRes = await fetch(`${BASE_URL}/api/bisect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "demo_dfs",
      probeId,
      selectedOptionId: "cs_opt_1",
    }),
  });
  const bisectAnsData = await bisectAnsRes.json();
  assert(
    "3. Step 2 Cognitive Bisect Root Gap Isolation",
    bisectAnsData.concluded && bisectAnsData.session?.likelyRootGapId === "call_stack",
    `Concluded: ${bisectAnsData.concluded}, Isolated Root Gap: ${bisectAnsData.session?.likelyRootGapId}`
  );

  // 4. Step 3 Recovery Lab Intervention & Assessment Load
  const recoveryRes = await fetch(`${BASE_URL}/api/recovery?sessionId=demo_dfs&conceptId=call_stack`);
  const recoveryData = await recoveryRes.json();
  assert(
    "4. Step 3 Recovery Lab Intervention Retrieval",
    recoveryData.success && recoveryData.intervention?.id && (recoveryData.retest?.id || recoveryData.retestAssessment?.id),
    `Intervention: ${recoveryData.intervention?.id}, Assessment: ${recoveryData.retest?.id || recoveryData.retestAssessment?.id}`
  );

  // 5. Empty re-test validation (expect 400 error)
  const emptyRetestRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "demo_dfs", conceptId: "call_stack", selectedOptionId: "" }),
  });
  assert("5. Empty Re-Test Rejection (HTTP 400)", emptyRetestRes.status === 400, `HTTP ${emptyRetestRes.status}`);

  // 6. Incorrect re-test handling (opt rt_1 is incorrect)
  const incRetestRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "demo_dfs", conceptId: "call_stack", selectedOptionId: "rt_1" }),
  });
  const incRetestData = await incRetestRes.json();
  assert(
    "6. Incorrect Re-Test Handling",
    incRetestData.isCorrect === false && incRetestData.status === "unresolved",
    `isCorrect: ${incRetestData.isCorrect}, status: ${incRetestData.status}`
  );

  // 7. Invariant check on incorrect re-test (recursion must remain locked)
  const incPathRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=demo_dfs`);
  const incPathData = await incPathRes.json();
  const recItemInc = incPathData.adaptivePath?.find((p) => p.conceptId === "recursion");
  assert(
    "7. Downstream Locked Invariant on Incorrect Re-Test",
    recItemInc && recItemInc.status === "locked" && recItemInc.blockingPrerequisite === "call_stack",
    `recursion: ${recItemInc?.status}, blockedBy: ${recItemInc?.blockingPrerequisite}`
  );

  // 8. Correct re-test handling (opt rt_2 is correct)
  const corRetestRes = await fetch(`${BASE_URL}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "demo_dfs", conceptId: "call_stack", selectedOptionId: "rt_2" }),
  });
  const corRetestData = await corRetestRes.json();
  assert(
    "8. Correct Re-Test Mastery",
    corRetestData.isCorrect === true && corRetestData.status === "recovered",
    `isCorrect: ${corRetestData.isCorrect}, status: ${corRetestData.status}, mastery: ${corRetestData.updatedMastery}%`
  );

  // 9. Step 4 Adaptive Roadmap BEFORE refresh (with sessionId)
  const pathBeforeRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=demo_dfs`);
  const pathBeforeData = await pathBeforeRes.json();
  const callStackBefore = pathBeforeData.adaptivePath?.find((p) => p.conceptId === "call_stack");
  const recBefore = pathBeforeData.adaptivePath?.find((p) => p.conceptId === "recursion");
  assert(
    "9. Step 4 Roadmap BEFORE Refresh (with sessionId)",
    callStackBefore?.status === "mastered" && recBefore?.status === "ready_to_learn",
    `call_stack: ${callStackBefore?.status}, recursion: ${recBefore?.status}`
  );

  // 10. Step 4 Adaptive Roadmap AFTER refresh (simulating browser reload with sessionId)
  const pathAfterRes = await fetch(`${BASE_URL}/api/adaptive-path?sessionId=demo_dfs`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  const pathAfterData = await pathAfterRes.json();
  const callStackAfter = pathAfterData.adaptivePath?.find((p) => p.conceptId === "call_stack");
  const recAfter = pathAfterData.adaptivePath?.find((p) => p.conceptId === "recursion");
  assert(
    "10. Step 4 Roadmap AFTER Refresh (with sessionId)",
    callStackAfter?.status === "mastered" && recAfter?.status === "ready_to_learn",
    `call_stack: ${callStackAfter?.status}, recursion: ${recAfter?.status}`
  );

  // 11. Step 4 Adaptive Roadmap AFTER refresh WITHOUT query params
  const pathNoParamRes = await fetch(`${BASE_URL}/api/adaptive-path`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  const pathNoParamData = await pathNoParamRes.json();
  const callStackNoParam = pathNoParamData.adaptivePath?.find((p) => p.conceptId === "call_stack");
  const recNoParam = pathNoParamData.adaptivePath?.find((p) => p.conceptId === "recursion");
  assert(
    "11. Step 4 Roadmap AFTER Refresh (fallback without params)",
    callStackNoParam?.status === "mastered" && recNoParam?.status === "ready_to_learn",
    `call_stack: ${callStackNoParam?.status}, recursion: ${recNoParam?.status}`
  );

  // 12. Causal DAG Graph State Consistency
  const graphRes = await fetch(`${BASE_URL}/api/graph?sessionId=demo_dfs`);
  const graphData = await graphRes.json();
  const graphCallStack = graphData.learnerStates?.call_stack;
  assert(
    "12. Causal DAG Graph State Consistency",
    graphCallStack?.status === "recovered",
    `call_stack status: ${graphCallStack?.status}, mastery: ${graphCallStack?.masteryScore}%`
  );

  console.log("\n===============================================================================");
  console.log(` RESULTS: ${passes} / ${total} PASSED (${passes === total ? "ALL PASSED" : "SOME FAILED"})`);
  console.log("===============================================================================");

  if (passes !== total) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
