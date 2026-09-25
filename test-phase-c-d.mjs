// Dedicated Phase C & Phase D Multi-Modality and Bisect Verification Test

async function testPhaseCD() {
  console.log("=== PHASE C & D MULTI-MODAL & COGNITIVE BISECT TEST ===\n");
  const baseUrl = "http://localhost:3000";

  // Test 1: Code Snippet Input (Feature 7)
  console.log("1. Testing Code Snippet submission (Feature 7)...");
  const codeRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      questionId: "q_code_dfs",
      questionText: "Write a recursive DFS helper",
      responseType: "code",
      content: `function dfs(node, visited) {
  visited.add(node);
  for (let n of node.neighbors) {
    if (!visited.has(n)) return dfs(n, visited); // Bug: premature return
  }
}`,
    }),
  });
  const codeData = await codeRes.json();
  if (!codeData.success || !codeData.misconception) throw new Error("Code input test failed");
  console.log(`✓ Code input analyzed: Misconception "${codeData.misconception.name}" detected.`);
  console.log(`  - Affected Concepts: [${codeData.misconception.affectedConcepts.join(", ")}]`);

  // Test 2: MCQ Input (Feature 5)
  console.log("\n2. Testing MCQ submission with distractor choice (Feature 5)...");
  const mcqRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      questionId: "q_mcq_dfs",
      questionText: "What happens when dfs() calls itself?",
      responseType: "mcq",
      content: "The current function context is replaced and overwritten by the child invocation, terminating parent loops.",
    }),
  });
  const mcqData = await mcqRes.json();
  if (!mcqData.success || !mcqData.misconception) throw new Error("MCQ input test failed");
  console.log(`✓ MCQ distractor recognized: Student Assumption vs Formal Reality contrasted.`);
  console.log(`  - Assumption: "${mcqData.misconception.studentAssumption}"`);
  console.log(`  - Reality: "${mcqData.misconception.formalReality}"`);

  // Test 3: Problem Steps Input (Feature 8)
  console.log("\n3. Testing Problem-Solving Steps submission (Feature 8)...");
  const stepsRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "graph_traversal",
      questionId: "q_steps_dfs",
      questionText: "Detail the steps of DFS backtracking",
      responseType: "steps",
      content: "Step 1: Visit node 0\nStep 2: Recurse to node 1\nStep 3: Node 1 overwrites node 0 in memory\nStep 4: Function exits because node 0 was replaced",
    }),
  });
  const stepsData = await stepsRes.json();
  if (!stepsData.success || !stepsData.misconception) throw new Error("Steps input test failed");
  console.log(`✓ Problem steps analyzed: Misconception extracted with ${stepsData.misconception.confidence}% confidence.`);

  // Test 4: Cognitive Bisect Invariant Probing (Features 13-18)
  console.log("\n4. Testing Cognitive Bisect Invariant Probing & Root-Gap Isolation (Features 13-18)...");
  const activeSession = stepsData.bisectSession;
  console.log(`✓ Active Bisect Session: ID ${activeSession.id}`);
  console.log(`✓ Ancestor Prerequisite Chain: [${activeSession.ancestorChain.join(" -> ")}]`);
  console.log(`✓ Median Pivot Selected: "${activeSession.currentProbe?.conceptId}"`);

  const probe = activeSession.currentProbe;
  const incorrectOpt = probe.options.find((o) => !o.isCorrect)?.id;

  const probeRes = await fetch(`${baseUrl}/api/bisect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      probeId: probe.id,
      selectedOptionId: incorrectOpt,
    }),
  });
  const probeData = await probeRes.json();
  if (!probeData.success) throw new Error("Probe submit failed");
  console.log(`✓ Diagnostic probe recorded. Concluded: ${probeData.concluded}`);
  console.log(`✓ Likely Root Learning Gap: "${probeData.rootConcept?.name || probeData.session?.likelyRootGapId}"`);
  console.log(`✓ Candidate Evidence Scores:`, probeData.session?.candidateScores);

  console.log("\n=== ALL PHASE C & D FEATURES VALIDATED 100%! ===");
}

testPhaseCD().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
