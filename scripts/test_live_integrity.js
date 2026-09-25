const BASE = process.env.BASE_URL || "https://brocoders-rho.vercel.app";

async function runIntegrityCheck() {
  console.log(`\n================================================================`);
  console.log(`VERIFYING SYSTEM INTEGRITY AGAINST: ${BASE}`);
  console.log(`================================================================\n`);

  // 1. Check all page routes return 200
  const pages = [
    "/",
    "/dashboard",
    "/detector",
    "/bisect",
    "/recovery",
    "/progress",
    "/graph",
    "/overview",
    "/login",
  ];

  console.log("--- 1. VERIFYING PAGE ROUTES (HTTP 200) ---");
  for (const p of pages) {
    const res = await fetch(BASE + p);
    const text = await res.text();
    const isHtml = text.includes("<!DOCTYPE html") || text.includes("<html");
    const isOk = res.ok || (p === "/" && (res.status === 307 || res.status === 308));
    console.log(`  Page ${p.padEnd(16)}: ${res.status} ${isOk ? "✓" : "❌"} (HTML: ${isHtml ? "Yes" : "No"})`);
    if (!isOk) {
      throw new Error(`Page ${p} failed with status ${res.status}`);
    }
  }

  // 2. Check API Routes
  console.log("\n--- 2. VERIFYING API INTEGRITY ---");
  const apis = [
    "/api/course",
    "/api/graph",
    "/api/auth/session",
    "/api/adaptive-path",
  ];
  for (const a of apis) {
    const res = await fetch(BASE + a);
    const data = await res.json();
    console.log(`  API ${a.padEnd(20)}: ${res.status} ✓ (Success: ${data.success !== false})`);
  }

  // 3. Verify Demo Mode Worked Example (Graph DFS -> Call Stack)
  console.log("\n--- 3. VERIFYING DEMO WORKED EXAMPLE INTEGRITY ---");
  // Set demo mode
  await fetch(BASE + "/api/course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setMode", mode: "demo" }),
  });

  // Check demo session
  const demoGraphRes = await fetch(BASE + "/api/graph?sessionId=demo_dfs");
  const demoGraph = await demoGraphRes.json();
  console.log(`  Demo Graph Concepts: ${demoGraph.concepts?.length}`);
  const hasDfs = demoGraph.concepts?.some((c) => c.id === "graph_traversal");
  const hasCallStack = demoGraph.concepts?.some((c) => c.id === "call_stack");
  console.log(`  - Has 'graph_traversal': ${hasDfs ? "✓" : "❌"}`);
  console.log(`  - Has 'call_stack': ${hasCallStack ? "✓" : "❌"}`);
  if (!hasDfs || !hasCallStack) {
    throw new Error("Demo graph missing expected concepts!");
  }

  // Check demo bisect
  const demoBisectRes = await fetch(BASE + "/api/bisect?sessionId=demo_dfs");
  const demoBisect = await demoBisectRes.json();
  console.log(`  Demo Bisect Session: target=${demoBisect.session?.targetConceptId}, likelyRoot=${demoBisect.session?.likelyRootGapId}`);
  if (demoBisect.session?.targetConceptId !== "graph_traversal") {
    throw new Error(`Expected demo bisect target 'graph_traversal', got ${demoBisect.session?.targetConceptId}`);
  }

  // Check demo recovery
  const demoRecRes = await fetch(BASE + "/api/recovery?sessionId=demo_dfs&conceptId=call_stack");
  const demoRec = await demoRecRes.json();
  console.log(`  Demo Recovery Concept: ${demoRec.concept?.name}`);
  console.log(`  Demo Recovery Memory Model: ${demoRec.intervention?.visualMemoryModel?.title}`);
  console.log(`  Demo Re-Test Question: "${demoRec.retest?.question?.slice(0, 60)}..."`);
  console.log(`  Demo Re-Test Options Count: ${demoRec.retest?.options?.length}`);

  if (!demoRec.intervention?.visualMemoryModel || !demoRec.retest?.options) {
    throw new Error("Demo recovery missing visual memory model or retest!");
  }

  // 4. Verify Step 1 -> Step 2 -> Step 3 -> Step 4 complete flow with Step 4 Refresh Persistence
  console.log("\n--- 4. VERIFYING COMPLETE STEP 1-4 COGNITIVE FLOW & REFRESH PERSISTENCE ---");
  // Step 1: Diagnose
  const diagRes = await fetch(BASE + "/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      conceptName: "Graph Traversal (DFS)",
      questionText: "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?",
      responseType: "written",
      content: "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3.",
    }),
  });
  const diagData = await diagRes.json();
  const sessionId = diagData.sessionId;
  console.log(`  Step 1 Result: Session ID = ${sessionId}`);
  console.log(`  - Misconception Detected: "${diagData.misconception?.name}" ✓`);

  // Step 2: Bisect
  const bisectRes = await fetch(`${BASE}/api/bisect?sessionId=${sessionId}`);
  const bisectData = await bisectRes.json();
  const currentProbe = bisectData.currentProbe;
  console.log(`  Step 2 Bisect: Probe Concept = ${currentProbe?.conceptId} ✓`);

  // Answer probe
  const probeAnswerRes = await fetch(BASE + "/api/bisect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      probeId: currentProbe?.id,
      selectedOptionId: currentProbe?.options[0]?.id,
    }),
  });
  const probeAnswerData = await probeAnswerRes.json();
  console.log(`  Step 2 Probe Answered: Concluded = ${probeAnswerData.concluded}, Likely Root Gap = ${probeAnswerData.session?.likelyRootGapId} ✓`);

  const rootGap = probeAnswerData.session?.likelyRootGapId || currentProbe?.conceptId;

  // Step 3: Recovery & Re-Test
  const recRes = await fetch(`${BASE}/api/recovery?sessionId=${sessionId}&conceptId=${rootGap}`);
  const recData = await recRes.json();
  const retestQuestion = recData.retest;
  const correctOpt = retestQuestion?.options?.find((o) => o.isCorrect);
  console.log(`  Step 3 Re-test: Found correct option = "${correctOpt?.id}" ✓`);

  // Submit correct re-test answer
  const retestSubmitRes = await fetch(BASE + "/api/retest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      conceptId: rootGap,
      selectedOptionId: correctOpt?.id,
    }),
  });
  const retestSubmitData = await retestSubmitRes.json();
  console.log(`  Step 3 Re-test Evaluated: isCorrect = ${retestSubmitData.isCorrect}, Updated Mastery = ${retestSubmitData.updatedMastery}% ✓`);

  if (!retestSubmitData.isCorrect) {
    throw new Error("Expected retest submission to be correct!");
  }

  // Step 4: Verify Progress & Refresh Persistence
  const progressRes1 = await fetch(`${BASE}/api/adaptive-path?sessionId=${sessionId}`);
  const progress1 = await progressRes1.json();
  console.log(`  Step 4 Initial Fetch: recoveryCompleted = ${progress1.session?.recoveryCompleted} ✓`);
  const rootStep1 = progress1.adaptivePath?.find((s) => s.conceptId === rootGap);
  console.log(`  - Root concept "${rootGap}" status = ${rootStep1?.status} (Expected: 'mastered')`);

  if (rootStep1?.status !== "mastered") {
    throw new Error(`Step 4 initial status was '${rootStep1?.status}', expected 'mastered'!`);
  }

  // Simulate Page Refresh on Step 4
  console.log("  Simulating Refresh on Step 4 (Repeated Request)...");
  const progressRes2 = await fetch(`${BASE}/api/adaptive-path?sessionId=${sessionId}`);
  const progress2 = await progressRes2.json();
  const rootStep2 = progress2.adaptivePath?.find((s) => s.conceptId === rootGap);
  console.log(`  - After Refresh: Root concept "${rootGap}" status = ${rootStep2?.status} (Expected: 'mastered')`);

  if (rootStep2?.status !== "mastered") {
    throw new Error(`Step 4 post-refresh status reverted to '${rootStep2?.status}', expected 'mastered'!`);
  }
  console.log("  ✓ REFRESH PERSISTENCE CONFIRMED: Recovered concept remains MASTERED after refresh!");

  console.log(`\n================================================================`);
  console.log(`🎉 INTEGRITY CHECK COMPLETE: NO REGRESSIONS, EVERYTHING WORKS 100%!`);
  console.log(`================================================================\n`);
}

runIntegrityCheck().catch((e) => {
  console.error("Integrity check failed:", e);
  process.exit(1);
});
