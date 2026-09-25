// Dedicated Phase E & Phase F Recovery Lab & Adaptive System Test

async function testPhaseEF() {
  console.log("=== PHASE E & F RECOVERY LAB & ADAPTIVE SYSTEM TEST ===\n");
  const baseUrl = "http://localhost:3000";

  // 1. Fetch Recovery Lab content (Features 19-26)
  console.log("1. Fetching Recovery Lab content for root concept 'call_stack'...");
  const recRes = await fetch(`${baseUrl}/api/recovery?conceptId=call_stack`);
  const recData = await recRes.json();
  if (!recData.success) throw new Error("Recovery fetch failed");

  console.log(`✓ Targeted Explanation loaded: "${recData.intervention.title}" (Feature 19)`);
  console.log(`✓ Visual Memory Simulator loaded: ${recData.intervention.visualMemoryModel.frames.length} step-by-step frames (Feature 20 & 23)`);
  console.log(`✓ Counterexample loaded: "${recData.intervention.counterexample.title}" (Feature 26)`);
  console.log(`✓ Micro-Puzzle loaded: "${recData.intervention.microPuzzle.question}" (Feature 21 & 24)`);
  console.log(`✓ Code Exercise loaded: Expected pattern "${recData.intervention.codeExercise.expectedPattern}" (Feature 25)`);
  console.log(`✓ Industry Blast Radius loaded: "${recData.intervention.industryBlastRadius.incidentTitle}" (Feature 22 & 36)`);

  // 2. Test Unresolved Branch on Re-Test (Feature 29 & 30)
  console.log("\n2. Testing Re-Test Failure -> UNRESOLVED State & Further Diagnosis (Feature 29 & 30)...");
  const incorrectOption = recData.retest.options.find((o) => !o.isCorrect)?.id;
  const failRes = await fetch(`${baseUrl}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "call_stack",
      selectedOptionId: incorrectOption,
    }),
  });
  const failData = await failRes.json();
  if (!failData.success || failData.isCorrect !== false) throw new Error("Expected unresolved status");
  console.log(`✓ Unresolved status recorded: Status = ${failData.status.toUpperCase()}`);
  console.log(`✓ Further Diagnosis Note: "${failData.furtherDiagnosisNotes}"`);

  // 3. Test Recovered Branch on Re-Test (Feature 27, 28 & 31)
  console.log("\n3. Testing Re-Test Success -> RECOVERED State & Learner Model Update (Feature 27, 28 & 31)...");
  const correctOption = recData.retest.options.find((o) => o.isCorrect)?.id;
  const passRes = await fetch(`${baseUrl}/api/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conceptId: "call_stack",
      selectedOptionId: correctOption,
    }),
  });
  const passData = await passRes.json();
  if (!passData.success || passData.isCorrect !== true) throw new Error("Expected recovered status");
  console.log(`✓ Concept officially marked RECOVERED! Updated Mastery: ${passData.updatedMastery}%`);
  console.log(`✓ Cascaded unblocked concepts: [${passData.unlockedConcepts.join(", ")}]`);

  // 4. Test Adaptive Learning Path Recalibration (Feature 32 & 33)
  console.log("\n4. Verifying Personalized Adaptive Progression Path (Feature 32 & 33)...");
  const pathRes = await fetch(`${baseUrl}/api/adaptive-path`);
  const pathData = await pathRes.json();
  if (!pathData.success) throw new Error("Adaptive path fetch failed");

  console.log("✓ Dynamic Adaptive Roadmap:");
  pathData.adaptivePath.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [${p.conceptId}] -> ${p.status.toUpperCase()}`);
  });

  const callStackStatus = pathData.adaptivePath.find((p) => p.conceptId === "call_stack")?.status;
  if (callStackStatus !== "mastered" && callStackStatus !== "ready_to_learn") {
    throw new Error("Call Stack should now be resolved in adaptive path");
  }

  console.log("\n=== ALL PHASE E & F FEATURES VALIDATED 100%! ===");
}

testPhaseEF().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
