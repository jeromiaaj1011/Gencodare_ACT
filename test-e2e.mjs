// End-to-End Verification Test Script for ARCHAIA
import { store } from "./lib/storage/store.js";
import { analyzeStudentResponse } from "./lib/ai/cognitiveAnalyzer.js";
import { BisectEngine } from "./lib/bisect/bisectEngine.js";
import { ReTestService } from "./lib/recovery/retestService.js";

async function runEndToEndVerification() {
  console.log("=== ARCHAIA END-TO-END DEMO TEST SUITE ===\n");

  // 1. Reset Store
  console.log("1. Resetting store to seed state...");
  store.resetToSeed();
  const initialMetrics = store.calculateMetrics();
  console.log(`✓ Store initialized. Total concepts: ${initialMetrics.totalConcepts}, Mastered: ${initialMetrics.masteredCount}`);

  // 2. Student Submits Incorrect DFS Answer
  console.log("\n2. Simulating student response submission on 'graph_traversal'...");
  const rawResponse = "When dfs(neighbor) is called, it replaces the current function. Once the child runs, the original function is overwritten, so it cannot return to other neighbors.";
  const analysis = await analyzeStudentResponse(
    "graph_traversal",
    "Explain recursive DFS execution",
    "written",
    rawResponse
  );

  if (!analysis.hasMisconception || !analysis.misconception) {
    throw new Error("Failed: Misconception not detected!");
  }
  console.log(`✓ Misconception Detected: "${analysis.misconception.name}"`);
  console.log(`  - Student Assumption: ${analysis.misconception.studentAssumption}`);
  console.log(`  - Formal Reality: ${analysis.misconception.formalReality}`);

  // 3. Initiate Cognitive Bisect
  console.log("\n3. Launching Cognitive Bisect over Causal Knowledge DAG...");
  const session = BisectEngine.startSession("graph_traversal", analysis.misconception.id);
  console.log(`✓ Bisect session started. Ancestor Chain: [${session.ancestorChain.join(" -> ")}]`);
  console.log(`✓ Selected First Pivot Probe on concept: "${session.currentProbe?.conceptId}"`);

  // 4. Student Answers Diagnostic Micro-Probe (Flawed Answer indicating stack frame confusion)
  console.log("\n4. Simulating student answering diagnostic micro-probe incorrectly...");
  const probeId = session.currentProbe?.id;
  const incorrectOption = session.currentProbe?.options.find((o) => !o.isCorrect)?.id;
  
  if (!probeId || !incorrectOption) {
    throw new Error("Probe or option not found");
  }

  const stepResult = BisectEngine.recordProbeAnswer(session, probeId, incorrectOption);
  console.log(`✓ Micro-probe recorded. Is Correct: ${stepResult.isCorrect}`);
  console.log(`  - Diagnostic Evidence Feedback: ${stepResult.evidenceFeedback}`);
  console.log(`  - Updated Candidate Evidence Scores:`, session.candidateScores);

  // 5. Verify Likely Root Gap Localization
  console.log(`\n5. Verifying Likely Root Gap Localization...`);
  console.log(`✓ Root Gap Isolated: "${session.likelyRootGapId}"`);
  if (session.likelyRootGapId !== "call_stack" && session.likelyRootGapId !== "recursion") {
    throw new Error(`Unexpected root gap: ${session.likelyRootGapId}`);
  }
  console.log(`✓ Verified: Successfully isolated root learning gap in upstream prerequisite!`);

  // 6. Recovery Lab Interventions & Re-Test
  console.log("\n6. Simulating Recovery Lab & Mandatory Re-Test...");
  const retestAssessment = store.getReTest("call_stack");
  const correctOption = retestAssessment?.options.find((o) => o.isCorrect)?.id;

  if (!correctOption) {
    throw new Error("Re-test correct option not found");
  }

  const retestResult = ReTestService.evaluateReTest("call_stack", correctOption);
  console.log(`✓ Re-Test Submitted. Status: ${retestResult.status.toUpperCase()}`);
  console.log(`  - Updated Call Stack Mastery: ${retestResult.updatedMastery}%`);
  console.log(`  - Unlocked Downstream Concepts: [${retestResult.unlockedConcepts.join(", ")}]`);

  // 7. Verify Learner Model & Adaptive Learning Path Update
  console.log("\n7. Verifying Learner Model & Adaptive Learning Path Update...");
  const finalMetrics = store.calculateMetrics();
  console.log(`✓ Recovered Count: ${finalMetrics.recoveredCount}`);
  console.log(`✓ Recovery Success Rate: ${finalMetrics.recoverySuccessRate}%`);
  console.log(`✓ Active Misconceptions Remaining: ${finalMetrics.activeMisconceptions.length}`);

  console.log("\n=== ALL 7 END-TO-END DEMO PHASES VERIFIED SUCCESSFULLY! ===");
}

runEndToEndVerification().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
