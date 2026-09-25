const BASE_URL = process.env.TEST_BASE_URL || "https://brocoders-rho.vercel.app";

const SEED_DEMO_INVESTIGATION = {
  conceptId: "graph_traversal",
  conceptName: "Graph Traversal (DFS)",
  questionText: "Explain how Depth-First Search (DFS) backtracks when exploring a graph and why it doesn't get stuck in visited nodes.",
  writtenInput: "In recursive Depth-First Search (DFS), when dfs(neighbor) is invoked, it replaces the current function. When neighbor exploration completes, the entire traversal terminates because the parent function's state was replaced by the child call.",
};

console.log("===============================================================================");
console.log(` ARCHAIA COMPREHENSIVE END-TO-END TEST SUITE`);
console.log(` Target Environment: ${BASE_URL}`);
console.log("===============================================================================\n");

let passedCount = 0;
let failedCount = 0;

function report(caseName, ok, details = "") {
  if (ok) {
    console.log(`  ✅ [PASS] ${caseName}${details ? ` -> ${details}` : ""}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${caseName}${details ? ` -> ${details}` : ""}`);
    failedCount++;
  }
}

async function runAllCases() {
  console.log("-------------------------------------------------------------------------------");
  console.log(" [CASE 1] Mode A — Canonical Hackathon Demo Workflow (End-to-End)");
  console.log("-------------------------------------------------------------------------------");

  // 1.1 Verify Mode is Demo
  try {
    const res = await fetch(`${BASE_URL}/api/course`);
    const data = await res.json();
    report("1.1 Mode Detection", data.success && data.mode === "demo", `Current Mode: ${data.mode}`);
  } catch (e) {
    report("1.1 Mode Detection", false, e.message);
  }

  // 1.2 Verify Detector SSR Preload
  try {
    const res = await fetch(`${BASE_URL}/detector`);
    const html = await res.text();
    const hasDfsTitle = html.includes("Graph Traversal (DFS)");
    const hasStudentInput = html.includes("In recursive Depth-First Search (DFS)");
    report(
      "1.2 Detector First-Paint SSR Prefill",
      res.status === 200 && hasDfsTitle && hasStudentInput,
      "Graph Traversal & student response prefilled directly in SSR HTML"
    );
  } catch (e) {
    report("1.2 Detector First-Paint SSR Prefill", false, e.message);
  }

  // 1.3 POST /api/analyze with Benchmark Demo
  let sessionId = "demo_dfs";
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "demo_dfs",
        topic: SEED_DEMO_INVESTIGATION.conceptName,
        conceptId: SEED_DEMO_INVESTIGATION.conceptId,
        question: SEED_DEMO_INVESTIGATION.questionText,
        answer: SEED_DEMO_INVESTIGATION.writtenInput,
        responseType: "written",
      }),
    });
    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.sessionId === "demo_dfs" &&
      data.hasMisconception === true &&
      data.misconception?.id === "rec_context_replace" &&
      Array.isArray(data.concepts) &&
      data.concepts.length >= 4;

    report(
      "1.3 Cognitive Detector Analysis",
      ok,
      `Session: ${data.sessionId}, Misconception: "${data.misconception?.name}", DAG nodes: ${data.concepts?.length}`
    );
  } catch (e) {
    report("1.3 Cognitive Detector Analysis", false, e.message);
  }

  // 1.4 GET /api/bisect for active session
  let firstProbeId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/bisect?sessionId=${sessionId}`);
    const data = await res.json();
    firstProbeId = data.currentProbe?.id;
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.hasActiveSession === true &&
      data.currentProbe?.conceptId === "call_stack";

    report(
      "1.4 Cognitive Bisect Initialization",
      ok,
      `Active: ${data.hasActiveSession}, Probe Target: ${data.currentProbe?.conceptId} (${data.currentProbe?.id})`
    );
  } catch (e) {
    report("1.4 Cognitive Bisect Initialization", false, e.message);
  }

  // 1.5 POST /api/bisect with flawed invariant option (answering probe)
  try {
    const res = await fetch(`${BASE_URL}/api/bisect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "demo_dfs",
        probeId: firstProbeId || "probe_call_stack_frames",
        selectedOptionId: "cs_opt_1", // Invariant flaw: "They are overwritten by function C's variables"
      }),
    });
    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.isCorrect === false &&
      data.concluded === true &&
      data.session?.likelyRootGapId === "call_stack";

    report(
      "1.5 Cognitive Bisect Probe Answer & Root Gap Isolation",
      ok,
      `Concluded: ${data.concluded}, Isolated Root Gap: ${data.session?.likelyRootGapId}`
    );
  } catch (e) {
    report("1.5 Cognitive Bisect Probe Answer & Root Gap Isolation", false, e.message);
  }

  // 1.6 GET /api/recovery with isolated root gap
  try {
    const res = await fetch(`${BASE_URL}/api/recovery?sessionId=demo_dfs&conceptId=call_stack`);
    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.intervention?.rootConceptId === "call_stack" &&
      Boolean(data.intervention?.explanation) &&
      Boolean(data.retest?.options?.length);

    report(
      "1.6 Targeted Recovery Studio Module",
      ok,
      `Intervention: "${data.intervention?.title}", Retest options: ${data.retest?.options?.length}`
    );
  } catch (e) {
    report("1.6 Targeted Recovery Studio Module", false, e.message);
  }

  // 1.7 POST /api/retest with correct answer to recover mastery
  try {
    const res = await fetch(`${BASE_URL}/api/retest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "demo_dfs",
        conceptId: "call_stack",
        selectedOptionId: "rt_2", // Correct: "3 frames: solve(1) at bottom..."
      }),
    });
    const data = await res.json();
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.isCorrect === true &&
      data.status === "recovered" &&
      data.updatedMastery >= 90;

    report(
      "1.7 Re-Test Assessment & Mastery Recovery",
      ok,
      `isCorrect: ${data.isCorrect}, Status: ${data.status}, New Mastery: ${data.updatedMastery}%`
    );
  } catch (e) {
    report("1.7 Re-Test Assessment & Mastery Recovery", false, e.message);
  }

  // 1.8 GET /api/graph to verify DAG states and metrics update
  try {
    const res = await fetch(`${BASE_URL}/api/graph?sessionId=demo_dfs`);
    const data = await res.json();
    const callStackState = data.learnerStates?.["call_stack"];
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.concepts?.length >= 4 &&
      callStackState?.status === "recovered" &&
      callStackState?.masteryScore >= 90;

    report(
      "1.8 Topological DAG & Learner State Reflection",
      ok,
      `call_stack status: ${callStackState?.status}, mastery: ${callStackState?.masteryScore}`
    );
  } catch (e) {
    report("1.8 Topological DAG & Learner State Reflection", false, e.message);
  }

  // 1.9 POST /api/demo/reset
  try {
    const res = await fetch(`${BASE_URL}/api/demo/reset`, { method: "POST" });
    const data = await res.json();
    report("1.9 Demo Data Isolation & Reset", data.success === true, data.message);
  } catch (e) {
    report("1.9 Demo Data Isolation & Reset", false, e.message);
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log(" [CASE 2] Input Validation, Error Boundaries & Focus Management");
  console.log("-------------------------------------------------------------------------------");

  // 2.1 Missing Topic
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "", question: "What is DFS?", answer: "Traverse graphs" }),
    });
    const data = await res.json();
    report("2.1 Validation: Empty Topic Rejection", res.status === 400 && data.error === "Enter a topic or concept.", data.error);
  } catch (e) {
    report("2.1 Validation: Empty Topic Rejection", false, e.message);
  }

  // 2.2 Missing Question
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "DFS", question: "", answer: "Traverse graphs" }),
    });
    const data = await res.json();
    report("2.2 Validation: Empty Question Rejection", res.status === 400 && data.error === "Enter the question or problem.", data.error);
  } catch (e) {
    report("2.2 Validation: Empty Question Rejection", false, e.message);
  }

  // 2.3 Missing Answer/Reasoning
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "DFS", question: "Explain DFS", answer: "" }),
    });
    const data = await res.json();
    report("2.3 Validation: Empty Reasoning Rejection", res.status === 400 && data.error === "Add your reasoning, answer, or code before analyzing.", data.error);
  } catch (e) {
    report("2.3 Validation: Empty Reasoning Rejection", false, e.message);
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log(" [CASE 3] Mode B — Dynamic Custom Student Input Analysis");
  console.log("-------------------------------------------------------------------------------");

  // 3.1 Custom Real-World Concept Analysis (Binary Search)
  let customSessionId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Binary Search",
        question: "Why can 'mid = (low + high) / 2' fail in languages like Java or C++?",
        answer: "When low + high exceeds 2^31 - 1, it overflows to a negative integer, causing an ArrayIndexOutOfBoundsException.",
        responseType: "written",
      }),
    });
    const data = await res.json();
    customSessionId = data.sessionId;
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.sessionId &&
      data.sessionId !== "demo_dfs" &&
      Array.isArray(data.concepts) &&
      data.concepts.length > 0;

    report(
      "3.1 Dynamic Custom Topic Synthesis",
      ok,
      `Session ID: ${data.sessionId}, Concepts: ${data.concepts?.map((c) => c.name).join(" -> ")}`
    );
  } catch (e) {
    report("3.1 Dynamic Custom Topic Synthesis", false, e.message);
  }

  // 3.2 Dynamic Bisect Query for Custom Session
  try {
    const res = await fetch(`${BASE_URL}/api/bisect?sessionId=${customSessionId}`);
    const data = await res.json();
    report(
      "3.2 Custom Session Bisection Isolation",
      res.status === 200 && data.success === true,
      `Has Active Session: ${data.hasActiveSession}`
    );
  } catch (e) {
    report("3.2 Custom Session Bisection Isolation", false, e.message);
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log(" [CASE 4] Mode B — User-Uploaded Course Material Architecture");
  console.log("-------------------------------------------------------------------------------");

  // 4.1 Switch Mode to Course Mode
  try {
    const res = await fetch(`${BASE_URL}/api/course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setMode", mode: "course" }),
    });
    const data = await res.json();
    report("4.1 Content Mode Switch to 'course'", data.success && data.mode === "course", `Mode set to: ${data.mode}`);
  } catch (e) {
    report("4.1 Content Mode Switch to 'course'", false, e.message);
  }

  // 4.2 Ingest Course Material / Syllabus
  let createdCourseId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "uploadCourse",
        title: "Distributed Systems Architecture 101",
        subject: "Computer Science",
        content: `
          Module 1: Network Transport & TCP Handshakes
          Foundational prerequisite: Socket programming and buffer management.
          
          Module 2: Raft Consensus Algorithm
          Requires understanding RPCs and leader election.
          
          Module 3: Distributed State Machines
          Depends on log replication and Byzantine Fault Tolerance.
        `,
      }),
    });
    const data = await res.json();
    createdCourseId = data.course?.id;
    const ok =
      res.status === 200 &&
      data.success === true &&
      data.course?.title === "Distributed Systems Architecture 101" &&
      Array.isArray(data.course?.concepts) &&
      data.course?.concepts.length > 0;

    report(
      "4.2 Course Ingestion & Concept Extraction",
      ok,
      `Extracted ${data.course?.concepts?.length} concepts with automated prerequisite relations`
    );
  } catch (e) {
    report("4.2 Course Ingestion & Concept Extraction", false, e.message);
  }

  // 4.3 Ingest Single File via /api/analyze-file
  try {
    const res = await fetch(`${BASE_URL}/api/analyze-file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "Dijkstra.py",
        fileContent: "def dijkstra(graph, start):\n    distances = {node: float('inf') for node in graph}\n    distances[start] = 0\n    return distances",
        fileSize: 120,
      }),
    });
    const data = await res.json();
    report(
      "4.3 Direct File Code Ingestion & Problem Formulation",
      res.status === 200 && data.success === true,
      `Topic: ${data.analysis?.topic}, Language: ${data.analysis?.detectedLanguage}`
    );
  } catch (e) {
    report("4.3 Direct File Code Ingestion & Problem Formulation", false, e.message);
  }

  // 4.4 Switch Mode back to Demo Mode for pristine benchmark state
  try {
    const res = await fetch(`${BASE_URL}/api/course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setMode", mode: "demo" }),
    });
    const data = await res.json();
    report("4.4 Restore Mode to 'demo'", data.success && data.mode === "demo", `Restored to: ${data.mode}`);
  } catch (e) {
    report("4.4 Restore Mode to 'demo'", false, e.message);
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log(" [CASE 5] Security, Auth Session, Performance & Accessibility");
  console.log("-------------------------------------------------------------------------------");

  // 5.1 Unauthenticated Guest Session Handling
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`);
    const data = await res.json();
    report(
      "5.1 Guest Session 401 Normalization",
      res.status === 401 && data.authenticated === false,
      `Status: ${res.status}, Body: ${JSON.stringify(data)}`
    );
  } catch (e) {
    report("5.1 Guest Session 401 Normalization", false, e.message);
  }

  // 5.2 Root URL Redirect
  try {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    const isRedirect = res.status === 307 || res.status === 308 || res.status === 200;
    report(
      "5.2 Root Page Route Dispatch",
      isRedirect,
      `Status: ${res.status}, Location: ${res.headers.get("location") || "/dashboard"}`
    );
  } catch (e) {
    report("5.2 Root Page Route Dispatch", false, e.message);
  }

  // 5.3 Recovery Studio Landmark <h1> Check
  try {
    const res = await fetch(`${BASE_URL}/recovery`);
    const html = await res.text();
    const hasH1 = html.includes("<h1");
    report("5.3 Recovery Studio Top-Level <h1> Accessibility", hasH1, "Accessible <h1> rendered in DOM");
  } catch (e) {
    report("5.3 Recovery Studio Top-Level <h1> Accessibility", false, e.message);
  }

  console.log("\n===============================================================================");
  console.log(` ALL CASES COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllCases().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
