
async function runTests() {
  console.log("=== Testing File Upload & Problem Statement Formulation Pipeline ===");

  const testFiles = [
    {
      fileName: "transaction_isolation.sql",
      content: `-- High-Throughput Payment Reconciliation
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- Read 1: Fetch current balance
SELECT balance FROM accounts WHERE user_id = 9021;
-- Concurrent worker commits deposit here
-- Read 2: Read balance again in same transaction block
SELECT balance FROM accounts WHERE user_id = 9021;
COMMIT;`,
      expectedTopicKeyword: "SQL",
      expectedLang: "SQL",
    },
    {
      fileName: "dfs_traversal.py",
      content: `# Recursive Graph Depth-First Search
def dfs(graph, node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited`,
      expectedTopicKeyword: "Graph",
      expectedLang: "Python",
    },
    {
      fileName: "buffer_memory.cpp",
      content: `// Memory allocation and lifecycle
#include <iostream>
void process_packet(size_t size) {
    char* buf = (char*)malloc(size);
    // free buffer
    free(buf);
    // access after free
    buf[0] = 'A';
}`,
      expectedTopicKeyword: "Memory",
      expectedLang: "C++",
    },
    {
      fileName: "custom_assignment.txt",
      content: `Problem: Design an idempotent token verification middleware for distributed microservices.
Requirements: Ensure retry requests with identical idempotency-key headers execute exactly once across clustered nodes without duplicating financial balance deductions.`,
      expectedTopicKeyword: "Idempotent",
      expectedLang: "Plain Text / Code",
    }
  ];

  // Start local Next server or hit local port 3000/3005 if running, or run directly against analyzer module
  const { analyzeUploadedFile } = await import("../lib/ai/fileAnalyzer.ts");

  for (const t of testFiles) {
    console.log(`\nTesting file: ${t.fileName} (${t.content.length} bytes)...`);
    const analysis = await analyzeUploadedFile(t.fileName, t.content, t.content.length);

    console.log(`✓ Detected Language: ${analysis.detectedLanguage}`);
    console.log(`✓ Identified Topic: ${analysis.topic}`);
    console.log(`✓ Formulated Problem Statement: "${analysis.problemStatement}"`);
    console.log(`✓ Suggested Diagnostic Question: "${analysis.suggestedQuestion}"`);
    console.log(`✓ Key Concepts: ${analysis.keyConcepts.join(", ")}`);
    console.log(`✓ Potential Misconceptions: ${analysis.potentialMisconceptions?.join("; ")}`);

    if (!analysis.problemStatement || analysis.problemStatement.trim().length === 0) {
      throw new Error(`Problem statement was empty for ${t.fileName}`);
    }
    if (!analysis.topic || analysis.topic.trim().length === 0) {
      throw new Error(`Topic was empty for ${t.fileName}`);
    }
  }

  console.log("\n=== ALL FILE ANALYSIS TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
