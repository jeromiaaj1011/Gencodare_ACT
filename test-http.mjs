// Live HTTP API Integration Test for ARCHAIA

async function testHttpEndpoints() {
  console.log("=== ARCHAIA LIVE HTTP INTEGRATION TEST ===\n");
  const baseUrl = "http://localhost:3000";

  // 1. Test /api/graph
  console.log("1. Testing GET /api/graph...");
  const graphRes = await fetch(`${baseUrl}/api/graph`);
  const graphData = await graphRes.json();
  if (!graphData.success) throw new Error("Graph API failed");
  console.log(`✓ Graph loaded: ${graphData.concepts.length} concepts, ${graphData.edges.length} edges.`);

  // 2. Test /api/analyze (Student submits incorrect response on Graph Traversal)
  console.log("\n2. Testing POST /api/analyze...");
  const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      questionId: "q_dfs_recursive_1",
      questionText: "Explain the recursive execution of DFS.",
      responseType: "written",
      content: "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits.",
    }),
  });
  const analyzeData = await analyzeRes.json();
  if (!analyzeData.success || !analyzeData.misconception) throw new Error("Analyze API failed");
  console.log(`✓ Misconception detected: "${analyzeData.misconception.name}"`);
  console.log(`✓ Bisect session initialized: ID ${analyzeData.bisectSession?.id}`);
  console.log(`✓ Active probe: "${analyzeData.bisectSession?.currentProbe?.question}"`);

  // 3. Test /api/bisect (Student answers probe)
  console.log("\n3. Testing POST /api/bisect (Submitting diagnostic probe answer)...");
  const probe = analyzeData.bisectSession?.currentProbe;
  const incorrectOption = probe?.options.find((o) => !o.isCorrect)?.id;
  
  const bisectRes = await fetch(`${baseUrl}/api/bisect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      probeId: probe.id,
      selectedOptionId: incorrectOption,
    }),
  });
  const bisectData = await bisectRes.json();
  if (!bisectData.success) throw new Error("Bisect POST failed");
  console.log(`✓ Probe recorded. Evidence feedback: "${bisectData.evidenceFeedback}"`);
  console.log(`✓ Likely Root Gap: "${bisectData.rootConcept?.name || bisectData.session?.likelyRootGapId}"`);

  // 4. Test /api/recovery
  console.log("\n4. Testing GET /api/recovery?conceptId=call_stack...");
  const recRes = await fetch(`${baseUrl}/api/recovery?conceptId=call_stack`);
  const recData = await recRes.json();
  if (!recData.success) throw new Error("Recovery API failed");
  console.log(`✓ Recovery content loaded: "${recData.intervention?.title}"`);
  console.log(`✓ Visual Memory Simulator frames: ${recData.intervention?.visualMemoryModel?.frames?.length}`);
  console.log(`✓ Industry Blast Radius: "${recData.intervention?.industryBlastRadius?.incidentTitle}"`);

  // 5. Test /api/retest (Submitting correct answer on re-test)
  console.log("\n5. Testing POST /api/retest...");
  const correctOption = recData.retest?.options.find((o) => o.isCorrect)?.id;
  const retestRes = await fetch(`${baseUrl}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "call_stack",
      selectedOptionId: correctOption,
    }),
  });
  const retestData = await retestRes.json();
  if (!retestData.success || !retestData.isCorrect) throw new Error("Re-Test API failed");
  console.log(`✓ Re-Test passed! Status: ${retestData.status.toUpperCase()}`);
  console.log(`✓ Call Stack mastery updated to: ${retestData.updatedMastery}%`);
  console.log(`✓ Downstream concepts unlocked: [${retestData.unlockedConcepts.join(", ")}]`);

  // 6. Test /api/adaptive-path
  console.log("\n6. Testing GET /api/adaptive-path...");
  const pathRes = await fetch(`${baseUrl}/api/adaptive-path`);
  const pathData = await pathRes.json();
  if (!pathData.success) throw new Error("Adaptive path API failed");
  console.log(`✓ Personalized adaptive path calculated:`);
  pathData.adaptivePath.forEach((step, idx) => {
    console.log(`   ${idx + 1}. [${step.conceptId}] -> ${step.status.toUpperCase()}`);
  });

  console.log("\n=== LIVE HTTP API INTEGRATION TESTS PASSED 100%! ===");
}

testHttpEndpoints().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
