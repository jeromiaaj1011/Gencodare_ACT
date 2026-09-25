async function testEndpoint() {
  console.log("Testing POST http://localhost:3005/api/analyze-file...");

  const res = await fetch("http://localhost:3005/api/analyze-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "inventory_sync.sql",
      fileContent: `-- Transaction Isolation Test
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT quantity FROM inventory WHERE product_id = 42;
SELECT quantity FROM inventory WHERE product_id = 42;
COMMIT;`,
      fileSize: 180,
    }),
  });

  console.log(`HTTP Status: ${res.status}`);
  const json = await res.json();
  console.log("Response:", JSON.stringify(json, null, 2));

  if (!json.success || !json.analysis || !json.analysis.problemStatement) {
    throw new Error("Failed to receive analysis with problemStatement");
  }

  console.log("\n✓ HTTP Endpoint /api/analyze-file verified successfully!");
}

testEndpoint().catch((err) => {
  console.error("HTTP Test failed:", err);
  process.exit(1);
});
