async function testLive() {
  console.log("Testing live production deployment: https://brocoders-rho.vercel.app\n");
  
  const res = await fetch("https://brocoders-rho.vercel.app/detector");
  const text = await res.text();
  console.log("Status /detector:", res.status);
  console.log("Includes DFS concept prefilled in SSR HTML:", text.includes("Graph Traversal (DFS)"));
  console.log("Includes benchmark student response in SSR HTML:", text.includes("In recursive Depth-First Search"));
  console.log("Includes detector-topic ID:", text.includes("detector-topic"));

  const analyzeRes = await fetch("https://brocoders-rho.vercel.app/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "demo_dfs",
      topic: "Graph Traversal (DFS)",
      question: "Explain DFS backtracking",
      answer: "Recursive calls replace current state"
    })
  });
  console.log("Status /api/analyze:", analyzeRes.status);
  const analyzeData = await analyzeRes.json();
  console.log("Analyze Success:", analyzeData.success);
  console.log("Analyze Session ID:", analyzeData.sessionId);
  console.log("Analyze Misconception Object:", JSON.stringify(analyzeData.misconception));
  console.log("Analyze Concepts count:", analyzeData.concepts?.length);

  const bisectRes = await fetch("https://brocoders-rho.vercel.app/api/bisect?sessionId=demo_dfs");
  console.log("Status /api/bisect:", bisectRes.status);
  const bisectData = await bisectRes.json();
  console.log("Bisect active session:", bisectData.hasActiveSession);
  console.log("Bisect current probe target:", bisectData.currentProbe?.conceptId);

  const recoveryRes = await fetch("https://brocoders-rho.vercel.app/api/recovery?sessionId=demo_dfs&conceptId=call_stack");
  console.log("Status /api/recovery:", recoveryRes.status);
  const recoveryData = await recoveryRes.json();
  console.log("Recovery title:", recoveryData.intervention?.title);
  console.log("Retest question available:", !!recoveryData.retest);

  const sessionRes = await fetch("https://brocoders-rho.vercel.app/api/auth/session");
  console.log("Status /api/auth/session (guest):", sessionRes.status);
  const sessionData = await sessionRes.json();
  console.log("Session response:", JSON.stringify(sessionData));
}

testLive().catch(console.error);
