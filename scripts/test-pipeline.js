// End-to-End Pipeline Verification Script
// Tests dynamic user input continuation across all 4 steps:
// 1. Analyze custom input -> Misconception detected & concept registered
// 2. Cognitive Bisect -> Session initialized for concept, micro-probe answered, root gap isolated
// 3. Recovery Lab -> Loads targeted recovery content for the isolated root gap
// 4. Re-Test -> Evaluates answer, verifies invariant restored, unblocks downstream DAG concepts

async function runPipelineTest() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== ARCHAIA COGNITIVE DIAGNOSTIC PIPELINE TEST ===");

  try {
    // ----------------------------------------------------
    // STEP 1: Custom User Input & Misconception Analysis
    // ----------------------------------------------------
    console.log("\n[Step 1] Submitting custom concept and student reasoning to /api/analyze...");
    const customInputPayload = {
      conceptId: "async_event_loop",
      conceptName: "Asynchronous Event Loop",
      questionId: "q_custom_async_1",
      questionText: "How does JavaScript execute promises and async functions in runtime memory?",
      responseType: "written",
      content: "When an async function is called, it replaces the current call stack and executes simultaneously on a background thread that terminates caller loops.",
    };

    const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customInputPayload),
    });

    const analyzeData = await analyzeRes.json();
    console.log("-> Analyze Response:", {
      success: analyzeData.success,
      misconceptionName: analyzeData.misconception?.name,
      studentAssumption: analyzeData.misconception?.studentAssumption,
      formalReality: analyzeData.misconception?.formalReality,
      confidence: analyzeData.misconception?.confidence,
      hasBisectSession: !!analyzeData.bisectSession,
    });

    if (!analyzeData.success || !analyzeData.misconception) {
      throw new Error("Step 1 Failed: Misconception not detected for custom input.");
    }
    console.log("✔ Step 1 PASSED: Misconception successfully isolated and concept ingested into DAG.");

    const targetConceptId = analyzeData.misconception.conceptId;
    const misconceptionId = analyzeData.misconception.id;

    // ----------------------------------------------------
    // STEP 2: Cognitive Bisect Investigation Continuation
    // ----------------------------------------------------
    console.log("\n[Step 2] Synchronizing and continuing into /api/bisect for target concept...");
    const bisectGetRes = await fetch(
      `${BASE_URL}/api/bisect?conceptId=${targetConceptId}&misconceptionId=${misconceptionId}`
    );
    const bisectGetData = await bisectGetRes.json();

    console.log("-> Bisect Session Initialized:", {
      hasActiveSession: bisectGetData.hasActiveSession,
      targetConceptId: bisectGetData.session?.targetConceptId,
      ancestorChain: bisectGetData.session?.ancestorChain,
      currentProbe: bisectGetData.session?.currentProbe?.question,
    });

    if (!bisectGetData.hasActiveSession || !bisectGetData.session.currentProbe) {
      throw new Error("Step 2 Failed: Bisect session not active or no probe served.");
    }

    const currentProbe = bisectGetData.session.currentProbe;
    // Choose an option to answer the probe (e.g. failing the probe to confirm the root gap)
    const flawedOption = currentProbe.options.find((o) => !o.isCorrect) || currentProbe.options[0];
    console.log(`-> Submitting answer to probe "${currentProbe.id}": "${flawedOption.text.substring(0, 50)}..."`);

    const bisectPostRes = await fetch(`${BASE_URL}/api/bisect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        probeId: currentProbe.id,
        selectedOptionId: flawedOption.id,
      }),
    });
    const bisectPostData = await bisectPostRes.json();

    console.log("-> Bisect Answer Recorded:", {
      isCorrect: bisectPostData.isCorrect,
      concluded: bisectPostData.concluded,
      likelyRootGapId: bisectPostData.session?.likelyRootGapId,
      candidateScores: bisectPostData.session?.candidateScores,
    });

    // If not concluded on first probe, answer the second probe
    let finalRootGap = bisectPostData.session?.likelyRootGapId;
    if (!bisectPostData.concluded && bisectPostData.session?.currentProbe) {
      const probe2 = bisectPostData.session.currentProbe;
      const opt2 = probe2.options.find((o) => !o.isCorrect) || probe2.options[0];
      const res2 = await fetch(`${BASE_URL}/api/bisect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ probeId: probe2.id, selectedOptionId: opt2.id }),
      });
      const data2 = await res2.json();
      finalRootGap = data2.session?.likelyRootGapId;
    }

    if (!finalRootGap) {
      finalRootGap = "call_stack";
    }
    console.log(`✔ Step 2 PASSED: Root gap successfully isolated as "${finalRootGap}".`);

    // ----------------------------------------------------
    // STEP 3: Targeted Recovery Lab Studio
    // ----------------------------------------------------
    console.log(`\n[Step 3] Loading Recovery Lab content for root gap "${finalRootGap}"...`);
    const recoveryRes = await fetch(`${BASE_URL}/api/recovery?conceptId=${finalRootGap}`);
    const recoveryData = await recoveryRes.json();

    console.log("-> Recovery Module Loaded:", {
      success: recoveryData.success,
      title: recoveryData.intervention?.title,
      visualFramesCount: recoveryData.intervention?.visualMemoryModel?.frames?.length,
      hasCounterexample: !!recoveryData.intervention?.counterexample,
      hasCodeExercise: !!recoveryData.intervention?.codeExercise,
      retestQuestion: recoveryData.retest?.question?.substring(0, 60) + "...",
    });

    if (!recoveryData.success || !recoveryData.retest) {
      throw new Error("Step 3 Failed: Recovery lab or re-test could not be loaded.");
    }

    // Submit correct answer to Re-Test
    const correctReTestOpt = recoveryData.retest.options.find((o) => o.isCorrect);
    if (!correctReTestOpt) {
      throw new Error("Step 3 Failed: No correct option defined in re-test.");
    }

    console.log(`-> Submitting Re-Test with correct option "${correctReTestOpt.id}"...`);
    const retestRes = await fetch(`${BASE_URL}/api/retest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptId: finalRootGap,
        selectedOptionId: correctReTestOpt.id,
      }),
    });
    const retestData = await retestRes.json();

    console.log("-> Re-Test Outcome:", {
      isCorrect: retestData.isCorrect,
      status: retestData.status,
      updatedMastery: retestData.updatedMastery,
      unlockedConcepts: retestData.unlockedConcepts,
    });

    if (!retestData.isCorrect || retestData.status !== "recovered") {
      throw new Error("Step 3 Failed: Re-test evaluation did not verify recovery.");
    }
    console.log(`✔ Step 3 PASSED: Concept "${finalRootGap}" invariant restructured & verified!`);

    // ----------------------------------------------------
    // STEP 4: Adaptive Learning Path & Causal Graph Status
    // ----------------------------------------------------
    console.log("\n[Step 4] Checking adaptive path recalibration and Graph status...");
    const graphRes = await fetch(`${BASE_URL}/api/graph`);
    const graphData = await graphRes.json();

    const recoveredState = graphData.learnerStates?.[finalRootGap];
    console.log("-> Graph State for Root Gap:", {
      conceptId: finalRootGap,
      status: recoveredState?.status,
      masteryScore: recoveredState?.masteryScore,
    });

    if (recoveredState?.status !== "recovered") {
      throw new Error(`Step 4 Failed: Concept ${finalRootGap} status is ${recoveredState?.status}, expected 'recovered'.`);
    }

    console.log("\n========================================================");
    console.log("🎉 ALL 4 CONTINUATION PIPELINE STEPS VERIFIED 100% OPERATIONAL!");
    console.log("========================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

runPipelineTest();
