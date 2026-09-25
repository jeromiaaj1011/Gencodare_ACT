// scripts/verify-topics-e2e.mjs
// Verifies all required topics and flows against the running Next.js application

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function testEmptyStates() {
  console.log("\n========================================================");
  console.log("TEST 0: Fresh / Empty State Verification (No Demo Leak)");
  console.log("========================================================");

  // 1. Graph without session
  const graphRes = await fetch(`${BASE_URL}/api/graph`);
  const graphData = await graphRes.json();
  assert(graphData.isEmpty === true, "/api/graph returns isEmpty: true for fresh user");
  assert(Array.isArray(graphData.concepts) && graphData.concepts.length === 0, "/api/graph has 0 concepts for fresh user");

  // 2. Bisect without session
  const bisectRes = await fetch(`${BASE_URL}/api/bisect`);
  const bisectData = await bisectRes.json();
  assert(bisectData.hasActiveSession === false && bisectData.isEmpty === true, "/api/bisect returns isEmpty: true and hasActiveSession: false");

  // 3. Recovery without session
  const recoveryRes = await fetch(`${BASE_URL}/api/recovery`);
  const recoveryData = await recoveryRes.json();
  assert(recoveryData.hasContent === false && recoveryData.isEmpty === true, "/api/recovery returns isEmpty: true");

  // 4. Adaptive path without session
  const pathRes = await fetch(`${BASE_URL}/api/adaptive-path`);
  const pathData = await pathRes.json();
  assert(pathData.isEmpty === true && (!pathData.adaptivePath || pathData.adaptivePath.length === 0), "/api/adaptive-path returns isEmpty: true and empty adaptivePath");
}

async function testTopicSQL() {
  console.log("\n========================================================");
  console.log("TEST 1: Topic 1 - SQL Transaction Isolation");
  console.log("========================================================");

  const payload = {
    topic: "SQL Transaction Isolation",
    question: "Why can READ COMMITTED return different values between two reads?",
    answer: "The transaction should keep one fixed snapshot.",
    conceptName: "SQL Transaction Isolation",
    questionText: "Why can READ COMMITTED return different values between two reads?",
    content: "The transaction should keep one fixed snapshot.",
    responseType: "written",
  };

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  assert(data.success === true, "Analysis API succeeds");
  assert(data.sessionId && data.sessionId.startsWith("diag_"), "Returns unique diagnosticSessionId");

  const session = data.session;
  assert(session != null, "Session object returned");
  assert(session.topic === "SQL Transaction Isolation", "Session topic matches input topic");

  const textDump = JSON.stringify(data).toLowerCase();
  assert(!textDump.includes("graph traversal"), "Contains NO 'Graph Traversal'");
  assert(!textDump.includes("recursive context replacement"), "Contains NO 'recursive context replacement'");
  assert(!textDump.includes("call stack lifo"), "Contains NO 'call stack lifo'");

  const misconception = data.misconception;
  assert(misconception != null, "Misconception identified");
  console.log(`  Identified Misconception: "${misconception.name}"`);
  console.log(`  Student Assumption: "${misconception.studentAssumption}"`);
  console.log(`  Formal Reality: "${misconception.formalReality}"`);

  assert(
    misconception.name.toLowerCase().includes("snapshot") ||
    misconception.name.toLowerCase().includes("isolation") ||
    misconception.name.toLowerCase().includes("read committed") ||
    misconception.name.toLowerCase().includes("statement") ||
    misconception.name.toLowerCase().includes("transaction"),
    "Misconception is domain-specific to SQL Transaction Isolation"
  );

  // Verify Graph for this session
  const graphRes = await fetch(`${BASE_URL}/api/graph?sessionId=${session.id}`);
  const graphData = await graphRes.json();
  assert(graphData.concepts.length >= 3, `Graph has ${graphData.concepts.length} topic-specific nodes`);
  const conceptNames = graphData.concepts.map(c => c.name);
  console.log(`  Graph Nodes: ${conceptNames.join(" -> ")}`);
  assert(
    conceptNames.some(n => n.includes("Snapshot") || n.includes("Isolation") || n.includes("Transaction") || n.includes("Read")),
    "Graph nodes are strictly specific to SQL Transaction Isolation"
  );

  // Verify Bisect for this session
  const bisectRes = await fetch(`${BASE_URL}/api/bisect?sessionId=${session.id}`);
  const bisectData = await bisectRes.json();
  const currentProbe = bisectData.currentProbe || bisectData.session?.currentProbe;
  assert(currentProbe != null, "Bisect presents topic-specific diagnostic probe");
  console.log(`  Probe Question: "${currentProbe.question}"`);

  // Answer probe
  const probeAnswerRes = await fetch(`${BASE_URL}/api/bisect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: session.id,
      probeId: currentProbe.id,
      selectedOptionId: currentProbe.options[0].id,
    }),
  });
  const probeAnswerData = await probeAnswerRes.json();
  assert(probeAnswerData.success === true, "Probe answer submitted successfully");

  // Verify Recovery for this session
  const recoveryRes = await fetch(`${BASE_URL}/api/recovery?sessionId=${session.id}`);
  const recoveryData = await recoveryRes.json();
  assert(recoveryData.success === true && recoveryData.intervention != null, "Recovery lab content available for this session");
  const intervention = recoveryData.intervention;
  assert(
    intervention.counterexample.title.toLowerCase().includes("sql") ||
    intervention.counterexample.title.toLowerCase().includes("snapshot") ||
    intervention.counterexample.title.toLowerCase().includes("read") ||
    intervention.counterexample.title.toLowerCase().includes("isolation"),
    "Recovery lab counterexample is SQL-specific"
  );
  console.log(`  Recovery Lab Title: "${intervention.counterexample.title}"`);
  console.log(`  Blast Radius Incident: "${intervention.industryBlastRadius.incidentTitle}"`);
}

async function testTopicTCP() {
  console.log("\n========================================================");
  console.log("TEST 2: Topic 2 - TCP Congestion Control");
  console.log("========================================================");

  const payload = {
    topic: "TCP Congestion Control",
    question: "How does TCP distinguish between network delay and packet loss in Reno vs Cubic?",
    answer: "TCP assumes all packet losses are caused by transmission errors on the physical wire.",
    conceptName: "TCP Congestion Control",
    questionText: "How does TCP distinguish between network delay and packet loss in Reno vs Cubic?",
    content: "TCP assumes all packet losses are caused by transmission errors on the physical wire.",
    responseType: "written",
  };

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  assert(data.success === true, "Analysis succeeds for TCP Congestion Control");
  assert(data.session.topic === "TCP Congestion Control", "Session topic matches TCP Congestion Control");

  const textDump = JSON.stringify(data).toLowerCase();
  assert(!textDump.includes("graph traversal"), "Contains NO 'Graph Traversal'");
  assert(!textDump.includes("sql"), "Contains NO 'SQL'");

  const misconception = data.misconception;
  console.log(`  Identified Misconception: "${misconception.name}"`);
  assert(
    misconception.name.toLowerCase().includes("congestion") ||
    misconception.name.toLowerCase().includes("loss") ||
    misconception.name.toLowerCase().includes("buffer") ||
    misconception.name.toLowerCase().includes("packet"),
    "Misconception is strictly networking/TCP specific"
  );

  const graphRes = await fetch(`${BASE_URL}/api/graph?sessionId=${data.sessionId}`);
  const graphData = await graphRes.json();
  const conceptNames = graphData.concepts.map(c => c.name);
  console.log(`  Graph Nodes: ${conceptNames.join(" -> ")}`);
  assert(
    conceptNames.some(n => n.includes("CWND") || n.includes("Congestion") || n.includes("AIMD") || n.includes("Packet")),
    "Graph nodes are strictly specific to TCP Congestion Control"
  );
}

async function testTopicOOP() {
  console.log("\n========================================================");
  console.log("TEST 3: Topic 3 - Java Inheritance");
  console.log("========================================================");

  const payload = {
    topic: "Java Inheritance",
    question: "Why does superclass variable referencing subclass invoke subclass method?",
    answer: "The JVM copies all child class bytecodes into the parent class definition at compile time.",
    conceptName: "Java Inheritance",
    questionText: "Why does superclass variable referencing subclass invoke subclass method?",
    content: "The JVM copies all child class bytecodes into the parent class definition at compile time.",
    responseType: "written",
  };

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  assert(data.success === true, "Analysis succeeds for Java Inheritance");
  assert(data.session.topic === "Java Inheritance", "Session topic matches Java Inheritance");

  const textDump = JSON.stringify(data).toLowerCase();
  assert(!textDump.includes("graph traversal"), "Contains NO 'Graph Traversal'");

  const misconception = data.misconception;
  console.log(`  Identified Misconception: "${misconception.name}"`);
  assert(
    misconception.name.toLowerCase().includes("dispatch") ||
    misconception.name.toLowerCase().includes("vtable") ||
    misconception.name.toLowerCase().includes("virtual") ||
    misconception.name.toLowerCase().includes("inheritance") ||
    misconception.name.toLowerCase().includes("copy"),
    "Misconception is strictly OOP/Java inheritance specific"
  );

  const graphRes = await fetch(`${BASE_URL}/api/graph?sessionId=${data.sessionId}`);
  const graphData = await graphRes.json();
  const conceptNames = graphData.concepts.map(c => c.name);
  console.log(`  Graph Nodes: ${conceptNames.join(" -> ")}`);
  assert(
    conceptNames.some(n => n.includes("Dispatch") || n.includes("vtable") || n.includes("Inheritance") || n.includes("Polymorphism")),
    "Graph nodes are strictly specific to Java Inheritance"
  );
}

async function runAll() {
  try {
    await testEmptyStates();
    await testTopicSQL();
    await testTopicTCP();
    await testTopicOOP();
    console.log("\n========================================================");
    console.log("🎉 ALL E2E TOPIC-SPECIFIC TESTS PASSED WITH 100% ACCURACY!");
    console.log("========================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runAll();
