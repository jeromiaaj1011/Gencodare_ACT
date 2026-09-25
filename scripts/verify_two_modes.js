const http = require("http");

async function request(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const fetchOptions = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOptions);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log("=== ARCHAIA VERIFICATION: TWO-MODE ARCHITECTURE & DYNAMIC INGESTION ===");

  // 1. Verify Demo Mode
  console.log("\n[Test 1] Testing Demo Mode API...");
  const modeRes = await request("/api/course", {
    method: "POST",
    body: { action: "setMode", mode: "demo" }
  });
  console.log("Mode switch status:", modeRes.data.mode);

  const graphDemo = await request("/api/graph");
  console.log(`Demo Graph: ${graphDemo.data.concepts?.length} concepts, ${graphDemo.data.edges?.length} edges.`);
  const demoConceptNames = graphDemo.data.concepts?.map(c => c.name);
  console.log("Demo Concepts:", demoConceptNames);
  if (!demoConceptNames.some(n => n.includes("Graph") || n.includes("Recursion") || n.includes("Call Stack"))) {
    throw new Error("Demo concepts missing expected Graph DFS / Call Stack topics!");
  }
  console.log("✓ Test 1 Passed: Demo Mode verified.");

  // 2. Verify Course Material Ingestion (Mode B)
  console.log("\n[Test 2] Testing Course Material Ingestion & Concept Extraction...");
  const coursePayload = {
    action: "uploadCourse",
    title: "CS 241: Operating Systems & Thread Concurrency",
    subject: "Operating Systems",
    content: "Hardware context switching allows processes to share the CPU. Threads share address spaces, which requires Mutual Exclusion (mutexes) and Semaphores to protect critical sections against race conditions. Acquiring multiple locks without hierarchical ordering causes Circular Wait deadlocks."
  };

  const uploadRes = await request("/api/course", {
    method: "POST",
    body: coursePayload
  });

  console.log("Upload result message:", uploadRes.data.message);
  console.log("Extracted concepts count:", uploadRes.data.course?.concepts?.length);
  const courseConcepts = uploadRes.data.course?.concepts || [];
  console.log("Extracted Course Concepts:", courseConcepts.map(c => `${c.id} (${c.name})`));
  const courseEdges = uploadRes.data.course?.edges || [];
  console.log(`Extracted Prerequisite Edges (${courseEdges.length}):`);
  courseEdges.forEach(e => console.log(`  ${e.from} ➔ ${e.to}: "${e.rationale}"`));

  if (courseConcepts.length < 3 || courseEdges.length < 2) {
    throw new Error("Failed to extract sufficient concepts or prerequisite edges!");
  }
  console.log("✓ Test 2 Passed: Course Material ingested into Knowledge Graph.");

  // 3. Verify Graph in Course Mode
  console.log("\n[Test 3] Verifying /api/graph returns active course data in Course Mode...");
  const graphCourse = await request("/api/graph");
  console.log(`Course Graph: mode=${graphCourse.data.mode}, concepts=${graphCourse.data.concepts?.length}, edges=${graphCourse.data.edges?.length}`);
  if (graphCourse.data.mode !== "course") {
    throw new Error(`Expected mode 'course' but got '${graphCourse.data.mode}'`);
  }
  if (!graphCourse.data.concepts.some(c => c.name.toLowerCase().includes("mutex") || c.name.toLowerCase().includes("concurrency") || c.name.toLowerCase().includes("process"))) {
    throw new Error("Course Graph does not reflect Operating Systems concepts!");
  }
  console.log("✓ Test 3 Passed: Knowledge Graph operates on active course data.");

  // 4. Verify Diagnostic Analysis in Course Mode
  console.log("\n[Test 4] Testing Diagnostic Analyzer on an extracted course concept...");
  const targetCourseConcept = courseConcepts[courseConcepts.length - 1];
  const analyzeRes = await request("/api/analyze", {
    method: "POST",
    body: {
      conceptId: targetCourseConcept.id,
      conceptName: targetCourseConcept.name,
      questionText: `Under concurrent multi-threading, what happens when two threads access a critical section without acquiring a mutex?`,
      responseType: "written",
      content: "Both threads can execute simultaneously because the operating system guarantees memory values don't interfere with each other.",
    }
  });

  console.log("Analysis success:", analyzeRes.data.success);
  console.log("Has misconception:", analyzeRes.data.hasMisconception);
  console.log("Misconception name:", analyzeRes.data.misconception?.name);
  console.log("Session ID generated:", analyzeRes.data.sessionId);
  if (!analyzeRes.data.hasMisconception) {
    throw new Error("Expected misconception to be detected on race condition answer!");
  }
  console.log("✓ Test 4 Passed: Diagnostic Analyzer successfully deconstructed course concept mental model.");

  // 5. Verify Mode Switching & Non-Contamination
  console.log("\n[Test 5] Testing Non-Contamination and Seamless Mode Switching...");
  // Switch to demo mode
  await request("/api/course", { method: "POST", body: { action: "setMode", mode: "demo" } });
  const graphBackToDemo = await request("/api/graph");
  console.log("Switched to Demo. Mode:", graphBackToDemo.data.mode, "Concepts:", graphBackToDemo.data.concepts?.length);

  // Reset Demo Data
  const resetDemo = await request("/api/demo/reset", { method: "POST" });
  console.log("Demo Reset response:", resetDemo.data);

  // Switch back to course mode
  await request("/api/course", { method: "POST", body: { action: "setMode", mode: "course" } });
  const graphBackToCourse = await request("/api/graph");
  console.log("Switched back to Course. Mode:", graphBackToCourse.data.mode, "Concepts:", graphBackToCourse.data.concepts?.length);

  if (graphBackToCourse.data.concepts.length !== courseConcepts.length) {
    throw new Error("Course data was contaminated or deleted during demo reset!");
  }
  console.log("✓ Test 5 Passed: Non-contamination verified! Demo reset did not affect course data.");

  console.log("\n========================================================");
  console.log("🎉 ALL TESTS PASSED: Dynamic Course & Demo Modes 100% OPERATIONAL!");
  console.log("========================================================");
}

runVerification().catch(e => {
  console.error("Verification failed:", e);
  process.exit(1);
});
