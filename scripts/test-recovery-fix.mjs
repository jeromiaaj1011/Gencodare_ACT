async function testFixes() {
  console.log("Testing live production deployment: https://brocoders-rho.vercel.app\n");

  // 1. Direct /api/recovery without any query parameters
  const recApiRes = await fetch("https://brocoders-rho.vercel.app/api/recovery");
  const recApiData = await recApiRes.json();
  console.log("1. GET /api/recovery (no params) status:", recApiRes.status);
  console.log("   Success:", recApiData.success);
  console.log("   Intervention:", recApiData.intervention?.title);
  console.log("   Retest questions:", recApiData.retest?.options?.length);

  // 2. Direct /recovery SSR page without query params
  const recPageRes = await fetch("https://brocoders-rho.vercel.app/recovery");
  const recPageHtml = await recPageRes.text();
  console.log("2. GET /recovery (direct navigation) status:", recPageRes.status);
  console.log("   Includes Recovery Heading:", recPageHtml.includes("Targeted Recovery Lab Studio"));
  console.log("   No Dead-end redirect:", recPageRes.status === 200);

  // 3. /dashboard SSR page
  const dashRes = await fetch("https://brocoders-rho.vercel.app/dashboard");
  const dashHtml = await dashRes.text();
  console.log("3. GET /dashboard status:", dashRes.status);
  console.log("   Includes Benchmark Demo Card:", dashHtml.includes("DEMO INVESTIGATION BENCHMARK"));
  console.log("   Includes Direct Recovery Lab Demo Link:", dashHtml.includes("Enter Recovery Lab Demo"));
  console.log("   Includes Invariant Pipeline Health:", dashHtml.includes("Invariant Pipeline Health"));
}

testFixes().catch(console.error);
