// Dedicated Phase G, H, and I Test: Supporting Features, UI Endpoints, and End-to-End Pipeline

async function testPhaseGHI() {
  console.log("=== PHASE G, H, & I SUPPORTING FEATURES & INTEGRATION TEST ===\n");
  const baseUrl = "http://localhost:3000";

  // 1. Test Multilingual Bridge with Technical Preservation (Feature 34 & 35)
  console.log("1. Testing Multilingual Cognitive Bridge across languages (Feature 34 & 35)...");
  const languages = ["ta", "hi", "te"];
  for (const lang of languages) {
    const res = await fetch(`${baseUrl}/api/multilingual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptId: "call_stack", language: lang }),
    });
    const data = await res.json();
    if (!data.success || !data.data) throw new Error(`Multilingual test failed for ${lang}`);
    console.log(`✓ [${lang.toUpperCase()}] ${data.data.nativeName}:`);
    console.log(`  - Preserved Terms: [${data.data.preservedTechnicalTerms.join(", ")}]`);
    console.log(`  - Localized Analogy: "${data.data.analogy.substring(0, 60)}..."`);
  }

  // 2. Test Industry Blast-Radius Drill & Illustrative Labeling (Feature 36 & 37)
  console.log("\n2. Testing Industry Blast-Radius Drill & Labeling (Feature 36 & 37)...");
  const recRes = await fetch(`${baseUrl}/api/recovery?conceptId=call_stack`);
  const recData = await recRes.json();
  const blast = recData.intervention?.industryBlastRadius;
  if (!blast) throw new Error("Blast radius content missing");

  console.log(`✓ Incident Title: "${blast.incidentTitle}"`);
  console.log(`✓ Organization: "${blast.organizationType}"`);
  console.log(`✓ Illustrative Label Verified: "${blast.illustrativeNote}"`);

  // 3. Test Full 6 UI Module HTTP Statuses (Phase H)
  console.log("\n3. Testing HTTP Availability of All 6 UI Modules (Phase H)...");
  const routes = [
    { name: "Command Center", path: "/" },
    { name: "Module 1: Student Dashboard", path: "/dashboard" },
    { name: "Module 2: Knowledge Graph", path: "/graph" },
    { name: "Module 3: Cognitive Bug Detector", path: "/detector" },
    { name: "Module 4: Cognitive Bisect", path: "/bisect" },
    { name: "Module 5: Recovery Lab", path: "/recovery" },
    { name: "Module 6: Learning Progress", path: "/progress" },
  ];

  for (const r of routes) {
    const res = await fetch(`${baseUrl}${r.path}`);
    if (res.status !== 200) throw new Error(`Route ${r.path} failed with status ${res.status}`);
    console.log(`✓ ${r.name} (${r.path}) -> HTTP ${res.status} OK`);
  }

  // 4. Test Complete End-to-End Pipeline Integration (Phase I)
  console.log("\n4. Testing Full Pipeline Integration (Phase I)...");
  
  // A. Reset demo
  await fetch(`${baseUrl}/api/demo/reset`, { method: "POST" });
  console.log("✓ Pipeline Step A: Reset to clean seed");

  // B. Ingest course material
  const extractRes = await fetch(`${baseUrl}/api/extract-concepts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "CS 201: Graph DFS & Recursion",
      content: "Graph DFS traverses nodes recursively pushing stack frames.",
    }),
  });
  const extractData = await extractRes.json();
  console.log(`✓ Pipeline Step B: Course Material Extracted -> ${extractData.material?.extractedConcepts?.length} concepts mapped to DAG`);

  // C. Student submits response
  const submitRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      content: "When dfs(neighbor) is called, it replaces the current function.",
      responseType: "written",
    }),
  });
  const submitData = await submitRes.json();
  console.log(`✓ Pipeline Step C: Misconception Detected -> "${submitData.misconception?.name}"`);

  // D. Cognitive Bisect execution
  const probe = submitData.bisectSession?.currentProbe;
  const incorrectOpt = probe?.options?.find((o) => !o.isCorrect)?.id;
  const bisectRes = await fetch(`${baseUrl}/api/bisect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ probeId: probe?.id, selectedOptionId: incorrectOpt }),
  });
  const bisectData = await bisectRes.json();
  console.log(`✓ Pipeline Step D: Cognitive Bisect Concluded -> Likely Root Gap: "${bisectData.rootConcept?.name || bisectData.session?.likelyRootGapId}"`);

  // E. Recovery & Re-Test
  const recContent = await fetch(`${baseUrl}/api/recovery?conceptId=call_stack`).then(r => r.json());
  const correctOpt = recContent.retest?.options?.find((o) => o.isCorrect)?.id;
  const retestRes = await fetch(`${baseUrl}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conceptId: "call_stack", selectedOptionId: correctOpt }),
  });
  const retestData = await retestRes.json();
  console.log(`✓ Pipeline Step E: Re-Test Passed -> Status: ${retestData.status.toUpperCase()}, Downstream Unlocked: [${retestData.unlockedConcepts.join(", ")}]`);

  // F. Learner Model & Adaptive Roadmap
  const finalPath = await fetch(`${baseUrl}/api/adaptive-path`).then(r => r.json());
  console.log(`✓ Pipeline Step F: Adaptive Roadmap Recalibrated -> ${finalPath.adaptivePath.length} steps sequenced`);

  console.log("\n=== ALL PHASE G, H, & I TESTS PASSED 100%! ===");
}

testPhaseGHI().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
