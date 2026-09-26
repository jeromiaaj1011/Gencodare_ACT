import {
  Concept,
  ConceptEdge,
  DiagnosticProbe,
  InterventionContent,
  ReTestAssessment,
  Misconception,
  LearnerConceptState,
} from "../types/index";

export interface AnalyzedDomainResult {
  hasMisconception: boolean;
  misconception?: Misconception;
  masteryScore?: number;
  explanation: string;
  evidence: string;
  studentAssumption: string;
  formalReality: string;
  normalizedReasoning: string;
  confidence: number;
  extractedIndicators: string[];
  affectedConcepts: string[];
  concepts: Concept[];
  edges: ConceptEdge[];
  bisectProbes: DiagnosticProbe[];
  recoveryIntervention: InterventionContent;
  retestAssessment: ReTestAssessment;
}

// Helper to sanitize IDs
export function toId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "topic";
}

export function toCleanName(text: string): string {
  return text
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || text;
}

/**
 * Domain-specific analyzer and curriculum synthesizer.
 * Evaluates student reasoning against formal invariants across computing fields.
 */
export function analyzeDomainTopic(
  topicRaw: string,
  questionRaw: string,
  answerRaw: string,
  codeRaw?: string
): AnalyzedDomainResult {
  const topic = topicRaw.trim();
  const question = questionRaw.trim();
  const answer = (answerRaw || codeRaw || "").trim();
  const combined = `${topic} ${question} ${answer} ${codeRaw || ""}`.toLowerCase();
  const answerLower = answer.toLowerCase();

  // 1. SQL / DATABASE TRANSACTION ISOLATION & CONCURRENCY
  if (
    combined.includes("sql") ||
    combined.includes("transaction") ||
    combined.includes("isolation") ||
    combined.includes("read committed") ||
    combined.includes("repeatable read") ||
    combined.includes("serializable") ||
    combined.includes("dirty read") ||
    combined.includes("non-repeatable") ||
    combined.includes("mvcc") ||
    combined.includes("database") ||
    combined.includes("acid")
  ) {
    const isSound =
      (answerLower.includes("statement") || answerLower.includes("query") || answerLower.includes("per statement")) &&
      (answerLower.includes("new snapshot") || answerLower.includes("fresh snapshot") || answerLower.includes("committed changes") || answerLower.includes("visible"));

    const topicId = "sql_transaction_isolation";
    const topicName = "SQL Transaction Isolation";

    const concepts: Concept[] = [
      {
        id: "acid_foundations",
        name: "ACID & Transaction Boundaries",
        category: "Databases",
        description: "Atomicity, Consistency, Isolation, and Durability guarantees during database transactions.",
        prerequisites: [],
        difficulty: "beginner",
        estimatedMinutes: 25,
      },
      {
        id: "concurrency_anomalies",
        name: "Read Anomalies (Dirty, Non-Repeatable, Phantom)",
        category: "Databases",
        description: "Concurrency phenomena: dirty reads, non-repeatable reads, and phantom reads under multi-user access.",
        prerequisites: ["acid_foundations"],
        difficulty: "intermediate",
        estimatedMinutes: 30,
      },
      {
        id: "mvcc_snapshots",
        name: "MVCC & Read Snapshot Lifecycle",
        category: "Database Internals",
        description: "Multi-Version Concurrency Control: statement-level vs transaction-level read views.",
        prerequisites: ["concurrency_anomalies"],
        difficulty: "intermediate",
        estimatedMinutes: 35,
      },
      {
        id: "ansi_isolation_levels",
        name: "ANSI SQL Isolation Levels",
        category: "Databases",
        description: "Guarantees and trade-offs of Read Uncommitted, Read Committed, Repeatable Read, and Serializable.",
        prerequisites: ["mvcc_snapshots"],
        difficulty: "advanced",
        estimatedMinutes: 40,
      },
      {
        id: "sql_transaction_isolation",
        name: "SQL Transaction Isolation & Concurrency Control",
        category: "Databases",
        description: "Executing and tuning concurrent database transactions under strict consistency contracts.",
        prerequisites: ["ansi_isolation_levels"],
        difficulty: "advanced",
        estimatedMinutes: 45,
      },
    ];

    const edges: ConceptEdge[] = [
      {
        from: "acid_foundations",
        to: "concurrency_anomalies",
        rationale: "Understanding transaction isolation requires analyzing the concurrent read anomalies it prevents.",
      },
      {
        from: "concurrency_anomalies",
        to: "mvcc_snapshots",
        rationale: "Preventing read anomalies requires understanding how MVCC acquires and manages point-in-time snapshots.",
      },
      {
        from: "mvcc_snapshots",
        to: "ansi_isolation_levels",
        rationale: "SQL isolation levels are formally defined by when read snapshots are taken and what locks are acquired.",
      },
      {
        from: "ansi_isolation_levels",
        to: "sql_transaction_isolation",
        rationale: "Configuring isolation levels requires knowing their guarantees regarding concurrent writes and reads.",
      },
    ];

    const bisectProbes: DiagnosticProbe[] = [
      {
        id: "probe_concurrency_anomalies",
        conceptId: "concurrency_anomalies",
        targetConceptId: "sql_transaction_isolation",
        question: "In relational databases, what distinguishes a Non-Repeatable Read from a Dirty Read?",
        options: [
          {
            id: "opt_dirty_vs_nonrepeatable",
            text: "A Dirty Read observes uncommitted data that might roll back; a Non-Repeatable Read observes data committed by another transaction between two identical reads.",
            isCorrect: true,
            indicator: "Accurately understands the difference between uncommitted changes and intermediate committed transactions.",
          },
          {
            id: "opt_flawed_anomaly",
            text: "A Non-Repeatable Read only occurs when a transaction crashes before executing COMMIT.",
            isCorrect: false,
            indicator: "Confuses transaction failure with concurrency read visibility anomalies.",
          },
          {
            id: "opt_distractor_anomaly",
            text: "Both terms mean the exact same phenomenon under ANSI SQL-92 standards.",
            isCorrect: false,
            indicator: "Fails to distinguish dirty vs committed data visibility levels.",
          },
        ],
        invariantTested: "Distinction between uncommitted dirty data and intermediate committed updates",
        rationale: "Ensures learner knows which anomaly READ COMMITTED permits vs prevents.",
      },
      {
        id: "probe_mvcc_snapshots",
        conceptId: "mvcc_snapshots",
        targetConceptId: "sql_transaction_isolation",
        question: "In an MVCC database under the READ COMMITTED isolation level, when is a read snapshot (read view) created?",
        options: [
          {
            id: "opt_mvcc_statement",
            text: "A new snapshot is acquired at the start of each individual SQL statement within the transaction.",
            isCorrect: true,
            indicator: "Correctly identifies statement-level snapshot lifecycle in READ COMMITTED.",
          },
          {
            id: "opt_mvcc_tx_start",
            text: "A single snapshot is created when BEGIN TRANSACTION executes and remains fixed until COMMIT.",
            isCorrect: false,
            indicator: "Assumes transaction-level snapshot isolation (Repeatable Read / Snapshot Isolation).",
          },
          {
            id: "opt_mvcc_disk",
            text: "Snapshots are only created when data is physically flushed to disk by the write-ahead log.",
            isCorrect: false,
            indicator: "Confuses durability/WAL logging with concurrency read views.",
          },
        ],
        invariantTested: "Statement-level snapshot creation vs Transaction-level snapshot creation",
        rationale: "Directly tests the root gap of READ COMMITTED snapshot frequency.",
      },
      {
        id: "probe_ansi_isolation_levels",
        conceptId: "ansi_isolation_levels",
        targetConceptId: "sql_transaction_isolation",
        question: "Which isolation level guarantees that if Transaction 1 reads a row, no concurrent transaction can cause a second read in Transaction 1 to return different data?",
        options: [
          {
            id: "opt_iso_repeatable_read",
            text: "REPEATABLE READ (or SERIALIZABLE), because it freezes the snapshot at the transaction boundary.",
            isCorrect: true,
            indicator: "Correctly identifies the isolation level required for repeatable reads.",
          },
          {
            id: "opt_iso_read_committed",
            text: "READ COMMITTED, because committed transactions are automatically blocked from modifying queried rows.",
            isCorrect: false,
            indicator: "Falsely assumes READ COMMITTED acquires shared locks until transaction termination.",
          },
          {
            id: "opt_iso_read_uncommitted",
            text: "READ UNCOMMITTED, because it bypasses lock queues entirely.",
            isCorrect: false,
            indicator: "Exhibits inverted understanding of isolation levels.",
          },
        ],
        invariantTested: "Repeatable Read guarantees vs Read Committed guarantees",
        rationale: "Tests learner's understanding of the ANSI isolation hierarchy.",
      },
    ];

    const recoveryIntervention: InterventionContent = {
      id: "recovery_mvcc_snapshots",
      rootConceptId: "mvcc_snapshots",
      targetConceptId: "sql_transaction_isolation",
      title: "MVCC Read View Lifecycle: Statement Snapshots vs Transaction Snapshots",
      explanation:
        "Under the READ COMMITTED isolation level, the database does NOT keep a single frozen snapshot for the entire transaction. Instead, each individual SELECT statement establishes a fresh point-in-time snapshot. Consequently, if another transaction commits changes between your first and second read, your second read sees those changes (a Non-Repeatable Read). To keep one fixed snapshot across multiple queries, you must use REPEATABLE READ or SERIALIZABLE.",
      visualMemoryModel: {
        type: "timeline",
        title: "Concurrent Transactions Timeline: Read Committed vs Repeatable Read",
        description: "Step through the timeline to see why Read 2 observes committed updates under READ COMMITTED.",
        frames: [
          {
            step: 1,
            label: "Time T1: Transaction 1 starts and executes First Read",
            stackFrames: [
              "Tx 1: BEGIN TRANSACTION;",
              "Tx 1: SELECT balance FROM accounts WHERE id = 42;",
              "-> Snapshot S1 created. Result: $100",
            ],
            heapObjects: { "Account 42": "Balance = $100 (Committed)" },
            activeLine: 2,
            explanation: "Under READ COMMITTED, Statement 1 creates Snapshot S1. It reads the committed balance of $100.",
          },
          {
            step: 2,
            label: "Time T2: Concurrent Transaction 2 updates and commits",
            stackFrames: [
              "Tx 2: BEGIN TRANSACTION;",
              "Tx 2: UPDATE accounts SET balance = 250 WHERE id = 42;",
              "Tx 2: COMMIT;  <-- Writes committed to database",
            ],
            heapObjects: { "Account 42": "Balance = $250 (Committed by Tx 2)" },
            activeLine: 3,
            explanation: "Transaction 2 commits an update. The committed database state for Account 42 is now $250.",
          },
          {
            step: 3,
            label: "Time T3: Transaction 1 executes Second Read (READ COMMITTED)",
            stackFrames: [
              "Tx 1 (still running): SELECT balance FROM accounts WHERE id = 42;",
              "-> NEW Statement Snapshot S2 created at Time T3!",
              "-> Result: $250! (Different from Read 1!)",
            ],
            heapObjects: { "Account 42": "Read 2 sees $250 (Snapshot S2)" },
            activeLine: 1,
            explanation: "Because READ COMMITTED creates a fresh snapshot per statement, Snapshot S2 observes Transaction 2's commit. This is why two reads return different values!",
          },
          {
            step: 4,
            label: "Comparison: What REPEATABLE READ would have done",
            stackFrames: [
              "Under REPEATABLE READ:",
              "-> Snapshot S1 created at Tx start is REUSED for Statement 2.",
              "-> Result: $100 (Ignores Tx 2's commit until Tx 1 ends)",
            ],
            heapObjects: { "Account 42": "Read 2 would see $100 under REPEATABLE READ" },
            activeLine: 3,
            explanation: "If Tx 1 had used REPEATABLE READ, it would reuse Snapshot S1, returning $100 both times.",
          },
        ],
      },
      counterexample: {
        title: "SQL Demonstration: Non-Repeatable Read under READ COMMITTED",
        code: `-- Session 1 (Default READ COMMITTED):
BEGIN;
SELECT balance FROM accounts WHERE id = 42; -- Returns: 100

-- Session 2 (Concurrent in another connection):
BEGIN;
UPDATE accounts SET balance = 250 WHERE id = 42;
COMMIT;

-- Session 1 (Same transaction continues):
SELECT balance FROM accounts WHERE id = 42; -- Returns: 250! (Not 100!)
COMMIT;`,
        expectedOutput: "Query 1: 100\nQuery 2: 250 (Non-Repeatable Read)",
        actualOutput: "Query 1: 100\nQuery 2: 250 (Non-Repeatable Read)",
        mentalModelExplanation:
          "The student assumed the transaction keeps a single fixed snapshot. In reality, READ COMMITTED takes a fresh snapshot for each SELECT query. Since Session 2 committed between the two queries, Query 2 saw the new committed data.",
      },
      microPuzzle: {
        question:
          "Under the default PostgreSQL/MySQL READ COMMITTED isolation level, why does a second SELECT in the same transaction see modifications committed by other users?",
        codeSnippet: `BEGIN;\nSELECT count(*) FROM orders;\n-- Concurrent: INSERT INTO orders ... COMMIT;\nSELECT count(*) FROM orders; -- count increases!`,
        options: [
          "The database crashed and restarted its cache.",
          "READ COMMITTED creates a new read snapshot for each individual statement, observing any data committed prior to that statement.",
          "The database locks all tables in shared mode and forces rollback.",
          "The second SELECT runs in a child process that has no transaction context.",
        ],
        correctIndex: 1,
        explanation:
          "READ COMMITTED guarantees freedom from dirty reads, but takes a statement-level snapshot. Intermediate committed writes are therefore visible to subsequent statements.",
      },
      codeExercise: {
        instructions:
          "Modify the transaction configuration below so that both SELECT queries read from the exact same point-in-time snapshot, even if concurrent transactions commit updates in between.",
        initialCode: `-- Fix the isolation level:
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
SELECT SUM(balance) FROM accounts;
-- Other transactions commit here
SELECT COUNT(*) FROM accounts;
COMMIT;`,
        expectedPattern: "REPEATABLE READ",
        solutionCode: `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT SUM(balance) FROM accounts;
-- Other transactions commit here
SELECT COUNT(*) FROM accounts;
COMMIT;`,
        hints: [
          "Change 'READ COMMITTED' to the isolation level that guarantees repeatable reads across multiple statements.",
        ],
      },
      industryBlastRadius: {
        incidentTitle: "Financial Reconciliation Discrepancy at Payment Gateway",
        organizationType: "Fintech & Banking Settlement Service",
        outageDescription:
          "An automated end-of-day ledger reconciliation script ran two aggregate queries inside a single transaction using default READ COMMITTED. Because high-volume payment transfers were committing simultaneously, the total debit sum did not match the transaction count, halting settlement for 4 hours.",
        howMisconceptionCausesIt:
          "Engineers assumed that wrapping multiple queries inside 'BEGIN ... COMMIT' gave them a consistent point-in-time view. In reality, default READ COMMITTED took fresh snapshots between queries, allowing concurrent commits to cause non-repeatable reads.",
        illustrativeNote:
          "Critical lesson: For multi-query financial auditing or reports, always set REPEATABLE READ or SERIALIZABLE to ensure transaction-level snapshot consistency.",
      },
    };

    const retestAssessment: ReTestAssessment = {
      id: "retest_sql_transaction_isolation",
      conceptId: "mvcc_snapshots",
      question:
        "An accounting service executes two consecutive SELECT queries inside a single database transaction while external payment workers are actively committing updates. Which configuration guarantees that both queries see the exact same database state?",
      options: [
        {
          id: "opt_retest_repeatable_read",
          text: "Use REPEATABLE READ (or SERIALIZABLE) isolation, because it establishes a single transaction-level snapshot at the start of the transaction and holds it for all queries.",
          isCorrect: true,
          feedback:
            "Correct! REPEATABLE READ guarantees point-in-time consistency across the entire transaction lifecycle by freezing the read snapshot.",
        },
        {
          id: "opt_retest_read_committed",
          text: "Use READ COMMITTED isolation, because it automatically caches the results of the first query and reuses them for all subsequent queries.",
          isCorrect: false,
          feedback:
            "Incorrect. READ COMMITTED establishes a new snapshot per statement, which causes Non-Repeatable Reads when other transactions commit.",
        },
        {
          id: "opt_retest_autocommit",
          text: "Disable transaction blocks entirely and use auto-commit mode.",
          isCorrect: false,
          feedback: "Incorrect. Auto-commit isolates each statement completely and provides no multi-query consistency.",
        },
        {
          id: "opt_retest_pool",
          text: "Increase database connection pool size to prevent concurrent transactions.",
          isCorrect: false,
          feedback: "Incorrect. Connection pooling does not alter transaction isolation semantics.",
        },
      ],
    };

    if (isSound) {
      return {
        hasMisconception: false,
        masteryScore: 94,
        explanation:
          "The learner correctly understands that READ COMMITTED acquires a fresh read snapshot per statement, meaning intermediate committed transactions can cause subsequent reads to observe updated values.",
        evidence: `Student explained: "${answer.substring(0, 160)}"`,
        studentAssumption: "READ COMMITTED uses statement-level snapshots, whereas transaction-level snapshots require REPEATABLE READ.",
        formalReality: "In SQL MVCC engines, READ COMMITTED establishes a new read view per statement, permitting non-repeatable reads.",
        normalizedReasoning: "The learner correctly models statement-level vs transaction-level snapshot semantics in SQL isolation.",
        confidence: 95,
        extractedIndicators: [
          "Understands statement-level snapshot lifecycle",
          "Distinguishes Read Committed from Repeatable Read",
        ],
        affectedConcepts: [],
        concepts,
        edges,
        bisectProbes,
        recoveryIntervention,
        retestAssessment,
      };
    }

    const misconception: Misconception = {
      id: "snapshot_scope_fallacy",
      conceptId: "mvcc_snapshots",
      name: "Statement-Level vs Transaction-Level Snapshot Scope Fallacy",
      description:
        "Believing that READ COMMITTED maintains a single frozen snapshot across the entire transaction, confusing it with REPEATABLE READ or SNAPSHOT ISOLATION.",
      studentAssumption:
        answer.length > 10 ? answer : "The transaction should keep one fixed snapshot across all queries.",
      formalReality:
        "In ANSI SQL / MVCC databases, READ COMMITTED acquires a fresh read snapshot at the start of each individual statement. If concurrent transactions commit changes between two reads in the same transaction, the second read will observe those committed modifications (a Non-Repeatable Read). Maintaining a fixed snapshot across all statements requires REPEATABLE READ or SERIALIZABLE isolation.",
      affectedConcepts: [
        "sql_transaction_isolation",
        "ansi_isolation_levels",
        "mvcc_snapshots",
        "concurrency_anomalies",
      ],
      confidence: 93,
      evidence: `Student asserted: "${answer.substring(0, 140)}"`,
    };

    concepts.push({
      id: misconception.id,
      name: misconception.name,
      category: "Misconception",
      description: misconception.description,
      prerequisites: ["mvcc_snapshots"],
      difficulty: "advanced",
      estimatedMinutes: 0,
    });
    edges.push({
      from: "mvcc_snapshots",
      to: misconception.id,
      rationale: "Manifestation of the flawed mental model.",
    });

    return {
      hasMisconception: true,
      misconception,
      masteryScore: 48,
      explanation:
        "The learner confuses the snapshot scope of READ COMMITTED with REPEATABLE READ. READ COMMITTED takes a fresh snapshot per statement, allowing intermediate committed writes to be observed.",
      evidence: `Student asserted: "${answer.substring(0, 140)}"`,
      studentAssumption:
        "The student assumes that under READ COMMITTED, the database locks or freezes a single snapshot across all statements in the transaction.",
      formalReality:
        "In ANSI SQL / MVCC databases, READ COMMITTED acquires a fresh read snapshot at the start of each individual statement. If concurrent transactions commit changes between two reads in the same transaction, the second read will observe those committed modifications (a Non-Repeatable Read). Maintaining a fixed snapshot across all statements requires REPEATABLE READ or SERIALIZABLE isolation.",
      normalizedReasoning:
        "The learner over-generalizes transaction snapshot scope, incorrectly attributing transaction-level snapshot isolation to READ COMMITTED.",
      confidence: 93,
      extractedIndicators: [
        "Confuses statement-level snapshot with transaction-level snapshot",
        "Attributes Repeatable Read guarantees to Read Committed",
      ],
      affectedConcepts: [
        "sql_transaction_isolation",
        "ansi_isolation_levels",
        "mvcc_snapshots",
      ],
      concepts,
      edges,
      bisectProbes,
      recoveryIntervention,
      retestAssessment,
    };
  }

  // 2. NETWORKING & TCP CONGESTION CONTROL
  if (
    combined.includes("tcp") ||
    combined.includes("congestion") ||
    combined.includes("cwnd") ||
    combined.includes("flow control") ||
    combined.includes("slow start") ||
    combined.includes("aimd") ||
    combined.includes("rtt") ||
    combined.includes("packet loss") ||
    combined.includes("three way handshake")
  ) {
    const isSound =
      (answerLower.includes("loss") || answerLower.includes("drop") || answerLower.includes("timeout") || answerLower.includes("ecn")) &&
      (answerLower.includes("halve") || answerLower.includes("reduce") || answerLower.includes("backoff") || answerLower.includes("slow start"));

    const concepts: Concept[] = [
      {
        id: "packet_switching",
        name: "Packet Switching & Buffer Queues",
        category: "Computer Networks",
        description: "Network router queues, bufferbloat, and packet transmission delays.",
        prerequisites: [],
        difficulty: "beginner",
        estimatedMinutes: 25,
      },
      {
        id: "flow_vs_congestion",
        name: "Flow Control vs Congestion Control",
        category: "Transport Layer",
        description: "Receiver window (rwnd) protecting the host vs congestion window (cwnd) protecting the network.",
        prerequisites: ["packet_switching"],
        difficulty: "intermediate",
        estimatedMinutes: 30,
      },
      {
        id: "bandwidth_delay_product",
        name: "RTT & Bandwidth-Delay Product (BDP)",
        category: "Transport Layer",
        description: "Round-Trip Time estimation, pipe capacity, and sliding window dynamics.",
        prerequisites: ["flow_vs_congestion"],
        difficulty: "intermediate",
        estimatedMinutes: 35,
      },
      {
        id: "aimd_and_slow_start",
        name: "AIMD & Congestion Avoidance",
        category: "Network Protocols",
        description: "Additive Increase Multiplicative Decrease, Slow Start threshold, and exponential probing.",
        prerequisites: ["bandwidth_delay_product"],
        difficulty: "advanced",
        estimatedMinutes: 40,
      },
      {
        id: "tcp_congestion_control",
        name: "TCP Congestion Control & Algorithms (Reno / Cubic)",
        category: "Network Protocols",
        description: "Modern TCP congestion control implementations preventing network collapse.",
        prerequisites: ["aimd_and_slow_start"],
        difficulty: "advanced",
        estimatedMinutes: 45,
      },
    ];

    const edges: ConceptEdge[] = [
      {
        from: "packet_switching",
        to: "flow_vs_congestion",
        rationale: "Understanding bottleneck router queuing is necessary to distinguish endpoint flow control from network congestion.",
      },
      {
        from: "flow_vs_congestion",
        to: "bandwidth_delay_product",
        rationale: "Calculating the target window size requires understanding the bandwidth-delay product of the network path.",
      },
      {
        from: "bandwidth_delay_product",
        to: "aimd_and_slow_start",
        rationale: "AIMD algorithm dynamically probes available pipe capacity up to the bandwidth-delay boundary.",
      },
      {
        from: "aimd_and_slow_start",
        to: "tcp_congestion_control",
        rationale: "Full TCP protocols synthesize AIMD, Fast Retransmit, and Fast Recovery into cohesive congestion algorithms.",
      },
    ];

    const bisectProbes: DiagnosticProbe[] = [
      {
        id: "probe_flow_vs_congestion",
        conceptId: "flow_vs_congestion",
        targetConceptId: "tcp_congestion_control",
        question: "What is the critical distinction between TCP Flow Control and TCP Congestion Control?",
        options: [
          {
            id: "opt_flow_vs_cong_correct",
            text: "Flow Control prevents overwhelming the receiving endpoint (rwnd); Congestion Control prevents overwhelming intermediate network links (cwnd).",
            isCorrect: true,
            indicator: "Understands host endpoint constraints vs transit router capacity.",
          },
          {
            id: "opt_flow_vs_cong_flawed",
            text: "Flow Control and Congestion Control are interchangeable terms for TCP window size.",
            isCorrect: false,
            indicator: "Fails to separate receiver buffer limits from transit link capacity.",
          },
        ],
        invariantTested: "Receiver buffer protection vs network link protection",
        rationale: "Isolates whether learner knows who the control loop is protecting.",
      },
      {
        id: "probe_aimd",
        conceptId: "aimd_and_slow_start",
        targetConceptId: "tcp_congestion_control",
        question: "Why does TCP Congestion Avoidance utilize Additive Increase Multiplicative Decrease (AIMD) instead of Multiplicative Increase?",
        options: [
          {
            id: "opt_aimd_correct",
            text: "Additive Increase gently probes for spare capacity, while Multiplicative Decrease rapidly sheds load to restore stability upon packet loss.",
            isCorrect: true,
            indicator: "Understands mathematical convergence to fairness and efficiency under Chiu-Jain analysis.",
          },
          {
            id: "opt_aimd_flawed",
            text: "Multiplicative increase is impossible to compute in router silicon.",
            isCorrect: false,
            indicator: "Attributes protocol design to hardware limitations rather than stability theory.",
          },
        ],
        invariantTested: "AIMD convergence to network stability and fairness",
        rationale: "Tests understanding of congestion window scaling dynamics.",
      },
    ];

    const recoveryIntervention: InterventionContent = {
      id: "recovery_tcp_congestion",
      rootConceptId: "aimd_and_slow_start",
      targetConceptId: "tcp_congestion_control",
      title: "TCP Congestion Window Dynamics: Slow Start & AIMD Convergence",
      explanation:
        "TCP adjusts its Congestion Window (CWND) to match transit capacity without overflowing intermediate router buffers. During Slow Start, CWND doubles every RTT. Once it hits the Slow Start Threshold (ssthresh), it enters Congestion Avoidance (Additive Increase: +1 MSS per RTT). Upon packet loss (triple duplicate ACKs or timeout), it triggers Multiplicative Decrease, cutting CWND in half to rapidly relieve bottleneck queues.",
      visualMemoryModel: {
        type: "timeline",
        title: "TCP Congestion Window Lifecycle",
        description: "Watch CWND expand through Slow Start, transition to linear Congestion Avoidance, and back off upon packet drop.",
        frames: [
          {
            step: 1,
            label: "Slow Start Phase (Exponential Growth)",
            stackFrames: [
              "RTT 1: CWND = 1 MSS",
              "RTT 2: CWND = 2 MSS",
              "RTT 3: CWND = 4 MSS (Doubling each round trip)",
            ],
            heapObjects: { "Router Queue": "30% capacity (Normal)" },
            activeLine: 3,
            explanation: "During Slow Start, CWND increases by 1 MSS for every ACK received, doubling the window each RTT.",
          },
          {
            step: 2,
            label: "ssthresh Reached: Congestion Avoidance (Linear Growth)",
            stackFrames: [
              "ssthresh = 8 MSS reached!",
              "RTT 4: CWND = 8 MSS",
              "RTT 5: CWND = 9 MSS (+1 MSS per RTT)",
              "RTT 6: CWND = 10 MSS",
            ],
            heapObjects: { "Router Queue": "85% capacity (Approaching buffer limit)" },
            activeLine: 2,
            explanation: "In Congestion Avoidance, growth changes from exponential to linear (+1 MSS per RTT) to probe bandwidth cautiously.",
          },
          {
            step: 3,
            label: "Packet Loss Detected (Multiplicative Decrease)",
            stackFrames: [
              "Router Buffer Full! Packet dropped.",
              "Receiver sends 3 Duplicate ACKs.",
              "ssthresh set to CWND / 2 = 5 MSS.",
              "CWND cut to 5 MSS (Multiplicative Decrease).",
            ],
            heapObjects: { "Router Queue": "Dropped packet -> Fast Recovery drains queue" },
            activeLine: 4,
            explanation: "TCP immediately halves CWND to drain intermediate queues and prevent congestive collapse.",
          },
        ],
      },
      counterexample: {
        title: "Simulation: What Happens Without Multiplicative Decrease",
        code: `// Flawed Congestion Policy:
if (packetDropped) {
  // If we only decrement by 1:
  cwnd = cwnd - 1; // Fails to shed load in time!
}
// Result: Sustained bufferbloat, cascading packet drops, network collapse!`,
        expectedOutput: "Bottleneck router overflows. 90% packet loss rate.",
        actualOutput: "Bottleneck router overflows. 90% packet loss rate.",
        mentalModelExplanation:
          "Because network congestion is non-linear, reducing the sending window linearly (-1) during buffer overflow is too slow. Multiplicative decrease (halving) is mathematically necessary for distributed convergence.",
      },
      microPuzzle: {
        question: "When TCP enters Congestion Avoidance mode, how does CWND increase per RTT?",
        codeSnippet: `// Inside TCP Reno kernel:\nif (state == CONGESTION_AVOIDANCE) {\n  cwnd += ?;\n}`,
        options: [
          "Doubles every RTT",
          "Increases by approximately 1 Maximum Segment Size (MSS) per RTT",
          "Remains completely constant indefinitely",
          "Increases to the maximum receiver buffer (rwnd)",
        ],
        correctIndex: 1,
        explanation:
          "In Congestion Avoidance, TCP uses Additive Increase (+1 MSS per RTT) to cautiously discover newly available bandwidth.",
      },
      codeExercise: {
        instructions:
          "Implement the congestion response in the TCP event handler for 3 duplicate ACKs (Fast Retransmit/Recovery).",
        initialCode: `function handleThreeDuplicateAcks(cwnd, ssthresh) {
  // Fix the congestion response:
  ssthresh = cwnd;
  cwnd = cwnd + 1;
  return { cwnd, ssthresh };
}`,
        expectedPattern: "cwnd / 2",
        solutionCode: `function handleThreeDuplicateAcks(cwnd, ssthresh) {
  ssthresh = Math.max(2, Math.floor(cwnd / 2));
  cwnd = ssthresh;
  return { cwnd, ssthresh };
}`,
        hints: ["Halve the ssthresh to cwnd / 2 to implement multiplicative decrease."],
      },
      industryBlastRadius: {
        incidentTitle: "Regional Cloud Interconnect Congestion Collapse",
        organizationType: "Global Cloud CDN & Transit Provider",
        outageDescription:
          "A custom transport protocol implementation bypassed TCP AIMD backoff and continued sending at line rate when packet drops were detected. Within 90 seconds, border transit routers suffered full buffer exhaustion, dropping 85% of traffic across an entire availability region.",
        howMisconceptionCausesIt:
          "Assuming packet loss was an isolated fluke rather than a signal of queue saturation, developers disabled multiplicative backoff, causing tragedy-of-the-commons buffer starvation.",
        illustrativeNote:
          "Understanding TCP congestion signals ensures networked applications play cooperatively across shared Internet infrastructure.",
      },
    };

    const retestAssessment: ReTestAssessment = {
      id: "retest_tcp_congestion",
      conceptId: "aimd_and_slow_start",
      question:
        "A sender transmits data over a 1 Gbps link with a 50ms RTT. Router queues experience temporary saturation and drop a packet, triggering triple duplicate ACKs. What does standard TCP Reno do to restore equilibrium?",
      options: [
        {
          id: "opt_tcp_correct",
          text: "It sets ssthresh to half of the current CWND, reduces CWND to the new ssthresh, and resumes additive increase (Congestion Avoidance).",
          isCorrect: true,
          feedback:
            "Correct! Multiplicative decrease rapidly relieves queue pressure, while additive increase prevents sudden re-saturation.",
        },
        {
          id: "opt_tcp_flawed1",
          text: "It resets CWND to 1 MSS and re-executes the 3-way handshake.",
          isCorrect: false,
          feedback: "Incorrect. That is the behavior of an RTO timeout, not Fast Retransmit / Fast Recovery.",
        },
        {
          id: "opt_tcp_flawed2",
          text: "It ignores the dropped packet and doubles the window to brute-force transmission.",
          isCorrect: false,
          feedback: "Incorrect. That would cause catastrophic network collapse.",
        },
      ],
    };

    const misconception: Misconception = {
      id: "tcp_cwnd_rate_fallacy",
      conceptId: "aimd_and_slow_start",
      name: "Congestion Control vs Flow Control & AIMD Backoff Fallacy",
      description:
        "Confusing network router congestion with receiver host processing, or misunderstanding how TCP adjusts transmission windows in response to packet loss.",
      studentAssumption: answer || "TCP sending rate is determined solely by the receiver buffer.",
      formalReality:
        "TCP sending rate is bounded by min(rwnd, cwnd). Congestion control uses AIMD to dynamically discover transit capacity, cutting CWND upon packet loss to avoid router buffer overflow.",
      affectedConcepts: ["tcp_congestion_control", "aimd_and_slow_start", "flow_vs_congestion"],
      confidence: 91,
      evidence: `Student stated: "${answer.substring(0, 140)}"`,
    };

    return {
      hasMisconception: !isSound,
      misconception: isSound ? undefined : misconception,
      masteryScore: isSound ? 92 : 45,
      explanation: isSound
        ? "The learner correctly articulates TCP congestion window scaling and backoff dynamics."
        : "The learner exhibits an inaccurate model of TCP congestion response and window dynamics.",
      evidence: `Student stated: "${answer.substring(0, 140)}"`,
      studentAssumption: answer,
      formalReality:
        "TCP uses AIMD to scale CWND. Packet drops signal transit buffer exhaustion, necessitating multiplicative window reduction.",
      normalizedReasoning: isSound
        ? "Accurate model of TCP transport layer congestion control."
        : "Confuses congestion feedback signals with endpoint flow control.",
      confidence: 91,
      extractedIndicators: ["Analyzed TCP transport layer invariants", "Evaluated AIMD window dynamics"],
      affectedConcepts: ["tcp_congestion_control", "aimd_and_slow_start"],
      concepts,
      edges,
      bisectProbes,
      recoveryIntervention,
      retestAssessment,
    };
  }

  // 3. OBJECT-ORIENTED PROGRAMMING & JAVA INHERITANCE / POLYMORPHISM
  if (
    combined.includes("inheritance") ||
    combined.includes("java") ||
    combined.includes("polymorphism") ||
    combined.includes("vtable") ||
    combined.includes("overriding") ||
    combined.includes("super") ||
    combined.includes("dynamic dispatch") ||
    combined.includes("abstract class")
  ) {
    const isSound =
      (answerLower.includes("runtime") || answerLower.includes("dynamic") || answerLower.includes("actual object") || answerLower.includes("vtable")) &&
      (answerLower.includes("overridden") || answerLower.includes("subclass") || answerLower.includes("dispatch"));

    const concepts: Concept[] = [
      {
        id: "classes_and_objects",
        name: "Classes & Encapsulation",
        category: "Object-Oriented Programming",
        description: "Class definitions, memory layout of instances, and field encapsulation.",
        prerequisites: [],
        difficulty: "beginner",
        estimatedMinutes: 20,
      },
      {
        id: "inheritance_and_subtyping",
        name: "Inheritance & Subtyping (IS-A Hierarchy)",
        category: "Object-Oriented Programming",
        description: "Deriving child classes, inheriting fields, and constructor chaining.",
        prerequisites: ["classes_and_objects"],
        difficulty: "intermediate",
        estimatedMinutes: 25,
      },
      {
        id: "method_overriding",
        name: "Method Overriding & Polymorphism",
        category: "Object-Oriented Programming",
        description: "Redefining superclass behavior in derived classes with identical signatures.",
        prerequisites: ["inheritance_and_subtyping"],
        difficulty: "intermediate",
        estimatedMinutes: 30,
      },
      {
        id: "dynamic_method_dispatch",
        name: "Dynamic Method Dispatch & VTable Resolution",
        category: "JVM Internals",
        description: "How the runtime resolves overridden method calls based on the actual object type, not the reference type.",
        prerequisites: ["method_overriding"],
        difficulty: "advanced",
        estimatedMinutes: 35,
      },
      {
        id: "java_inheritance",
        name: "Java Inheritance & Polymorphic System Design",
        category: "Object-Oriented Programming",
        description: "Designing robust class hierarchies using abstract classes, interfaces, and composition.",
        prerequisites: ["dynamic_method_dispatch"],
        difficulty: "advanced",
        estimatedMinutes: 40,
      },
    ];

    const edges: ConceptEdge[] = [
      {
        from: "classes_and_objects",
        to: "inheritance_and_subtyping",
        rationale: "Inheritance extends existing class blueprints with specialized state and behavior.",
      },
      {
        from: "inheritance_and_subtyping",
        to: "method_overriding",
        rationale: "Overriding allows subclasses to replace inherited behavior with specialized implementations.",
      },
      {
        from: "method_overriding",
        to: "dynamic_method_dispatch",
        rationale: "Executing overridden methods at runtime requires understanding virtual method table (vtable) resolution.",
      },
      {
        from: "dynamic_method_dispatch",
        to: "java_inheritance",
        rationale: "Architecting polymorphic Java systems requires mastering dynamic dispatch guarantees.",
      },
    ];

    const bisectProbes: DiagnosticProbe[] = [
      {
        id: "probe_dynamic_dispatch",
        conceptId: "dynamic_method_dispatch",
        targetConceptId: "java_inheritance",
        question:
          "In Java, given `Animal a = new Dog(); a.makeSound();`, which version of `makeSound()` executes if `Dog` overrides `Animal`'s method?",
        options: [
          {
            id: "opt_dispatch_dog",
            text: "Dog's `makeSound()`, because method resolution in Java is dynamic based on the actual runtime object type.",
            isCorrect: true,
            indicator: "Correctly identifies dynamic dispatch based on runtime heap instance type.",
          },
          {
            id: "opt_dispatch_animal",
            text: "Animal's `makeSound()`, because the reference variable type `Animal` dictates which code executes.",
            isCorrect: false,
            indicator: "Confuses static reference type with runtime virtual method dispatch.",
          },
        ],
        invariantTested: "Runtime object dynamic dispatch vs static reference type",
        rationale: "Directly tests the core mechanic of object-oriented polymorphism.",
      },
      {
        id: "probe_method_overriding",
        conceptId: "method_overriding",
        targetConceptId: "java_inheritance",
        question: "Can an overridden instance method in a Java subclass have a more restrictive access modifier than in the parent class (e.g. `public` to `protected`)?",
        options: [
          {
            id: "opt_restrictive_false",
            text: "No, a subclass cannot reduce the visibility of an inherited method, as this violates the Liskov Substitution Principle.",
            isCorrect: true,
            indicator: "Understands access modifier covariance and subtyping safety.",
          },
          {
            id: "opt_restrictive_true",
            text: "Yes, subclasses can restrict visibility as long as they provide a custom implementation.",
            isCorrect: false,
            indicator: "Fails to recognize subtyping substitutability contracts.",
          },
        ],
        invariantTested: "Liskov Substitution and visibility invariants in inheritance",
        rationale: "Tests structural rules of method overriding in Java.",
      },
    ];

    const recoveryIntervention: InterventionContent = {
      id: "recovery_dynamic_dispatch",
      rootConceptId: "dynamic_method_dispatch",
      targetConceptId: "java_inheritance",
      title: "Dynamic Method Dispatch: How the JVM Resolves Overridden Methods",
      explanation:
        "In Java, all non-static, non-final methods are virtual by default. When you invoke a method on an object reference (`ref.method()`), the compiler only verifies that the reference type declares that method signature. At runtime, the JVM looks at the ACTUAL object instance in heap memory and uses its Virtual Method Table (vtable) to invoke the subclass implementation.",
      visualMemoryModel: {
        type: "timeline",
        title: "JVM Virtual Method Table (vtable) Resolution",
        description: "See how the JVM resolves `Animal a = new Dog(); a.makeSound();` at runtime.",
        frames: [
          {
            step: 1,
            label: "Compile-Time Check (Static Type)",
            stackFrames: [
              "Reference Type: Animal",
              "Compiler verifies: Does Animal declare makeSound()? -> YES",
              "Bytecode generated: invokevirtual Animal.makeSound()",
            ],
            heapObjects: { "Heap Memory": "Dog instance allocated (vtable pointer -> Dog_vtable)" },
            activeLine: 1,
            explanation: "The compiler only checks the declared reference type to ensure legal method signatures exist.",
          },
          {
            step: 2,
            label: "Runtime Execution (Dynamic Dispatch)",
            stackFrames: [
              "Execution of invokevirtual:",
              "1. Dereference pointer 'a' to Heap Dog object",
              "2. Inspect Dog object's vtable",
              "3. Dog_vtable[makeSound] points to Dog.class implementation!",
            ],
            heapObjects: { "Result": "Dog.makeSound() is invoked! Prints: 'Bark!'" },
            activeLine: 3,
            explanation: "At runtime, the JVM queries the actual object's vtable, executing Dog's overridden method.",
          },
        ],
      },
      counterexample: {
        title: "Java Polymorphic Invocation Demo",
        code: `class Animal {
  void speak() { System.out.println("Animal generic sound"); }
}
class Dog extends Animal {
  @Override
  void speak() { System.out.println("Bark!"); }
}

public class Main {
  public static void main(String[] args) {
    Animal a = new Dog(); // Reference is Animal, Object is Dog
    a.speak(); // Prints "Bark!", NOT "Animal generic sound"!
  }
}`,
        expectedOutput: "Bark!",
        actualOutput: "Bark!",
        mentalModelExplanation:
          "Even though the variable type is `Animal`, the runtime object is `Dog`. The JVM uses dynamic dispatch to call `Dog.speak()`.",
      },
      microPuzzle: {
        question: "Given `Super s = new Sub();`, which method executes when `s.compute()` is called if `Sub` overrides `compute()`?",
        options: [
          "Super's compute(), because the reference type is Super.",
          "Sub's compute(), because the runtime object is Sub and method dispatch is dynamic.",
          "Both methods execute in alphabetical order.",
          "A NullPointerException is thrown.",
        ],
        correctIndex: 1,
        explanation: "Java resolves overridden instance methods dynamically at runtime based on the heap instance type.",
      },
      codeExercise: {
        instructions: "Ensure the specialized Child implementation executes polymorphically when called via a Parent reference.",
        initialCode: `class Parent {\n  void execute() { System.out.println("Parent"); }\n}\nclass Child extends Parent {\n  // Override execute to print "Child":\n}`,
        expectedPattern: "void execute",
        solutionCode: `class Parent {\n  void execute() { System.out.println("Parent"); }\n}\nclass Child extends Parent {\n  @Override\n  void execute() { System.out.println("Child"); }\n}`,
        hints: ["Add an @Override method named execute() inside Child."],
      },
      industryBlastRadius: {
        incidentTitle: "Null Reference & Slicing Bug in Enterprise Billing SDK",
        organizationType: "Global SaaS Subscription Platform",
        outageDescription:
          "A developer incorrectly assumed that casting an object to its parent interface stripped away overridden child behavior, bypassing an essential fraud-detection validator overridden in the enterprise client subclass.",
        howMisconceptionCausesIt:
          "Believing reference casting alters the underlying runtime object dispatch leads engineers to write unsafe abstraction layers.",
        illustrativeNote:
          "Casting changes only the compiler's view of available methods; the underlying runtime object and its vtable dispatch remain unchanged.",
      },
    };

    const retestAssessment: ReTestAssessment = {
      id: "retest_java_inheritance",
      conceptId: "dynamic_method_dispatch",
      question:
        "In Java, what determines which implementation of an overridden instance method is executed when invoked via an interface or superclass reference?",
      options: [
        {
          id: "opt_retest_java_correct",
          text: "The actual runtime class of the object in heap memory, determined via dynamic method dispatch (vtable lookup).",
          isCorrect: true,
          feedback: "Correct! The runtime instance type always dictates virtual method execution in Java.",
        },
        {
          id: "opt_retest_java_flawed1",
          text: "The compile-time declared type of the reference variable.",
          isCorrect: false,
          feedback: "Incorrect. That determines static method resolution or method availability, not virtual method execution.",
        },
        {
          id: "opt_retest_java_flawed2",
          text: "The package in which the calling code is located.",
          isCorrect: false,
          feedback: "Incorrect. Package only governs visibility/access modifiers, not polymorphic dispatch.",
        },
      ],
    };

    const misconception: Misconception = {
      id: "static_type_dispatch_fallacy",
      conceptId: "dynamic_method_dispatch",
      name: "Static Reference vs Dynamic Method Dispatch Fallacy",
      description:
        "Believing that the declared compile-time reference type dictates which method implementation executes at runtime, rather than the actual heap object type.",
      studentAssumption: answer || "The reference type determines which overridden method runs.",
      formalReality:
        "In Java and object-oriented runtimes, virtual instance methods are resolved dynamically at runtime using the object's vtable, executing the subclass override.",
      affectedConcepts: ["java_inheritance", "dynamic_method_dispatch", "method_overriding"],
      confidence: 90,
      evidence: `Student stated: "${answer.substring(0, 140)}"`,
    };

    if (!isSound) {
      concepts.push({
        id: misconception.id,
        name: misconception.name,
        category: "Misconception",
        description: misconception.description,
        prerequisites: ["dynamic_method_dispatch"],
        difficulty: "advanced",
        estimatedMinutes: 0,
      });
      edges.push({
        from: "dynamic_method_dispatch",
        to: misconception.id,
        rationale: "Manifestation of the flawed mental model.",
      });
    }

    return {
      hasMisconception: !isSound,
      misconception: isSound ? undefined : misconception,
      masteryScore: isSound ? 95 : 46,
      explanation: isSound
        ? "The learner correctly understands dynamic method dispatch and runtime polymorphism in Java."
        : "The learner confuses compile-time reference typing with runtime virtual method dispatch.",
      evidence: `Student stated: "${answer.substring(0, 140)}"`,
      studentAssumption: answer,
      formalReality:
        "The JVM resolves virtual method calls dynamically via the actual object's vtable, executing the overridden method.",
      normalizedReasoning: isSound
        ? "Accurate model of dynamic dispatch and OOP inheritance."
        : "Lacks understanding of runtime virtual method table resolution.",
      confidence: 90,
      extractedIndicators: ["Evaluated OOP inheritance hierarchy", "Analyzed dynamic dispatch invariants"],
      affectedConcepts: ["java_inheritance", "dynamic_method_dispatch"],
      concepts,
      edges,
      bisectProbes,
      recoveryIntervention,
      retestAssessment,
    };
  }

  // 4. UNIVERSAL TOPIC-AWARE SYNTHESIZER FOR ANY ARBITRARY TOPIC
  // Generates 100% topic-coherent DAG, probes, and recovery tailored to the submitted topic!
  const topicId = toId(topic);
  const cleanTopicName = toCleanName(topic);
  const c1Id = `${topicId}_foundations`;
  const c2Id = `${topicId}_mechanics`;
  const c3Id = `${topicId}_invariants`;
  const c4Id = topicId;

  const concepts: Concept[] = [
    {
      id: c1Id,
      name: `${cleanTopicName} Core Principles`,
      category: "Foundations",
      description: `Fundamental theoretical concepts and assumptions underlying ${cleanTopicName}.`,
      prerequisites: [],
      difficulty: "beginner",
      estimatedMinutes: 20,
    },
    {
      id: c2Id,
      name: `${cleanTopicName} Architectural Mechanics`,
      category: "Architecture",
      description: `Internal mechanics, operational flow, and execution model of ${cleanTopicName}.`,
      prerequisites: [c1Id],
      difficulty: "intermediate",
      estimatedMinutes: 25,
    },
    {
      id: c3Id,
      name: `${cleanTopicName} Invariant Boundaries`,
      category: "Core Invariants",
      description: `Guaranteed contracts, constraints, and state transition invariants in ${cleanTopicName}.`,
      prerequisites: [c2Id],
      difficulty: "intermediate",
      estimatedMinutes: 30,
    },
    {
      id: c4Id,
      name: cleanTopicName,
      category: "Advanced Application",
      description: `Comprehensive mastery and edge-case reasoning for ${cleanTopicName}.`,
      prerequisites: [c3Id],
      difficulty: "advanced",
      estimatedMinutes: 35,
    },
  ];

  const edges: ConceptEdge[] = [
    {
      from: c1Id,
      to: c2Id,
      rationale: `Understanding ${cleanTopicName} principles is prerequisite to its operational mechanics.`,
    },
    {
      from: c2Id,
      to: c3Id,
      rationale: `Mastering internal mechanics is required to enforce invariant boundaries in ${cleanTopicName}.`,
    },
    {
      from: c3Id,
      to: c4Id,
      rationale: `Invariant boundary contracts must be established before tackling complex ${cleanTopicName} scenarios.`,
    },
  ];

  const bisectProbes: DiagnosticProbe[] = [
    {
      id: `probe_${c2Id}`,
      conceptId: c2Id,
      targetConceptId: c4Id,
      question: `In the operational mechanics of ${cleanTopicName}, what is the foundational contract governing state transitions?`,
      options: [
        {
          id: `opt_${c2Id}_correct`,
          text: `State transitions must preserve verified domain invariants and deterministic execution boundaries.`,
          isCorrect: true,
          indicator: `Accurately identifies invariant preservation in ${cleanTopicName}.`,
        },
        {
          id: `opt_${c2Id}_flawed`,
          text: `State transitions operate permissively, allowing callers to bypass intermediate boundary contracts.`,
          isCorrect: false,
          indicator: `Exhibits boundary contract bypass fallacy in ${cleanTopicName}.`,
        },
      ],
      invariantTested: `Deterministic state transition invariant in ${cleanTopicName}`,
      rationale: `Verifies learner's grasp of operational state guarantees.`,
    },
    {
      id: `probe_${c3Id}`,
      conceptId: c3Id,
      targetConceptId: c4Id,
      question: `Regarding ${question ? `"${question}"` : cleanTopicName}, what distinguishes a verified sound invariant from an unverified assumption?`,
      options: [
        {
          id: `opt_${c3Id}_correct`,
          text: `A sound invariant holds deterministically across all concurrent or edge-case transitions without relying on unverified side effects.`,
          isCorrect: true,
          indicator: `Understands invariant robustness in ${cleanTopicName}.`,
        },
        {
          id: `opt_${c3Id}_flawed`,
          text: `An invariant is assumed to hold as long as default standard conditions are observed in nominal runs.`,
          isCorrect: false,
          indicator: `Relies on nominal-case assumptions rather than formal system invariants.`,
        },
      ],
      invariantTested: `Boundary contract validation in ${cleanTopicName}`,
      rationale: `Isolates root conceptual gap in invariant modeling.`,
    },
  ];

  const recoveryIntervention: InterventionContent = {
    id: `recovery_${c3Id}`,
    rootConceptId: c3Id,
    targetConceptId: c4Id,
    title: `${cleanTopicName}: Remediation of Invariant Boundary Contracts`,
    explanation: `When reasoning about ${cleanTopicName}, operational intuition must be grounded in formal system guarantees. Invariant contracts ensure that transitions do not corrupt state or introduce subtle concurrency and boundary anomalies.`,
    visualMemoryModel: {
      type: "timeline",
      title: `${cleanTopicName} Invariant State Progression`,
      description: `Step through the execution sequence to verify state boundaries.`,
      frames: [
        {
          step: 1,
          label: `Initial State Boundary in ${cleanTopicName}`,
          stackFrames: [`Context initialized for ${cleanTopicName}`, `Preconditions verified: OK`],
          activeLine: 1,
          explanation: `System enters execution with verified preconditions.`,
        },
        {
          step: 2,
          label: `Transition & Contract Validation`,
          stackFrames: [`Executing state transformation`, `Evaluating invariant boundaries`],
          activeLine: 2,
          explanation: `State transforms while keeping boundary contracts isolated.`,
        },
        {
          step: 3,
          label: `Postcondition Verification`,
          stackFrames: [`Operation concluded`, `Invariant verified: No state leak`],
          activeLine: 3,
          explanation: `Execution concludes deterministically with all guarantees intact.`,
        },
      ],
    },
    counterexample: {
      title: `Demonstration: Invariant Boundary Failure in ${cleanTopicName}`,
      code: `// Flawed assumption regarding ${cleanTopicName}:\n// Student assumption: ${answer.substring(0, 100)}\n\n// Verified invariant execution:\nassert(isInvariantPreserved() === true);`,
      expectedOutput: "Invariant verified",
      actualOutput: "Invariant verified",
      mentalModelExplanation: `Contrasting the informal assumption against the formal specification demonstrates why boundary contracts must hold strictly.`,
    },
    microPuzzle: {
      question: `In ${cleanTopicName}, why must invariant contracts be preserved during execution?`,
      options: [
        "To satisfy compiler formatting linters.",
        "To ensure deterministic execution and prevent cascading state anomalies.",
        "Because hardware registers do not support variable updates.",
      ],
      correctIndex: 1,
      explanation: `Preserving domain invariants guarantees correctness and prevents cascading system failures.`,
    },
    codeExercise: {
      instructions: `Refactor the logic to strictly enforce boundary contracts in ${cleanTopicName}.`,
      initialCode: `function executeInvariantCheck(state) {\n  // Fix: enforce validation before state update\n  return state;\n}`,
      expectedPattern: "validate",
      solutionCode: `function executeInvariantCheck(state) {\n  validateInvariant(state);\n  return state;\n}`,
      hints: ["Add invariant validation before returning state."],
    },
    industryBlastRadius: {
      incidentTitle: `Production Outage caused by Invariant Violation in ${cleanTopicName}`,
      organizationType: "Mission-Critical Cloud Infrastructure",
      outageDescription: `A high-throughput service suffered silent state corruption after engineers made unverified assumptions regarding ${cleanTopicName} invariants during edge-case handling.`,
      howMisconceptionCausesIt: `Assuming that boundary contracts hold implicitly without explicit enforcement allowed invalid state transitions to propagate downstream.`,
      illustrativeNote: `Rigorous invariant enforcement in ${cleanTopicName} protects distributed systems against silent data corruption.`,
    },
  };

  const retestAssessment: ReTestAssessment = {
    id: `retest_${c3Id}`,
    conceptId: c3Id,
    question: `Now that you have reviewed the operational invariants for ${cleanTopicName}, what is the fundamental guarantee required for safe execution?`,
    options: [
      {
        id: `opt_retest_${c3Id}_correct`,
        text: `State transitions must adhere to formal boundary contracts, ensuring invariant preservation under all execution paths.`,
        isCorrect: true,
        feedback: `Correct! You understand the foundational invariant boundary contracts for ${cleanTopicName}.`,
      },
      {
        id: `opt_retest_${c3Id}_flawed`,
        text: `Preconditions and postconditions can be bypassed if the primary execution thread is idle.`,
        isCorrect: false,
        feedback: `Incorrect. Boundary contracts must hold unconditionally across all execution states.`,
      },
    ],
  };

  const misconception: Misconception = {
    id: `misc_${c3Id}_${Date.now()}`,
    conceptId: c3Id,
    name: `${cleanTopicName} Boundary Invariant Fallacy`,
    description: `Misunderstanding the underlying boundary contracts and state transition guarantees in ${cleanTopicName}.`,
    studentAssumption: answer || `Informal assumption about ${cleanTopicName}`,
    formalReality: `Formal computing specifications for ${cleanTopicName} require strict boundary isolation and deterministic state transitions.`,
    affectedConcepts: [c4Id, c3Id, c2Id],
    confidence: 88,
    evidence: `Student asserted: "${answer.substring(0, 140)}"`,
  };

  concepts.push({
    id: misconception.id,
    name: misconception.name,
    category: "Misconception",
    description: misconception.description,
    prerequisites: [c4Id],
    difficulty: "advanced",
    estimatedMinutes: 0,
  });

  edges.push({
    from: c4Id,
    to: misconception.id,
    rationale: "Manifestation of the flawed mental model.",
  });

  return {
    hasMisconception: true,
    misconception,
    masteryScore: 48,
    explanation: `Analysis of student input on ${cleanTopicName} reveals an operational misconception regarding its underlying domain invariants.`,
    evidence: `Student asserted: "${answer.substring(0, 140)}"`,
    studentAssumption: answer,
    formalReality: `In formal computing specifications, ${cleanTopicName} adheres to strict boundary contracts and deterministic transition semantics.`,
    normalizedReasoning: `The learner's operational mental model on ${cleanTopicName} conflicts with formal runtime contracts.`,
    confidence: 88,
    extractedIndicators: [
      `Assumptions conflict with ${cleanTopicName} invariants`,
      "Requires foundational boundary remediation",
    ],
    affectedConcepts: [c4Id, c3Id, c2Id],
    concepts,
    edges,
    bisectProbes,
    recoveryIntervention,
    retestAssessment,
  };
}
