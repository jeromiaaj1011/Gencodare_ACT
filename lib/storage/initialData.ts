import {
  Concept,
  ConceptEdge,
  LearnerConceptState,
  Misconception,
  DiagnosticProbe,
  InterventionContent,
  ReTestAssessment,
  CourseMaterial,
} from "../types";
import { INITIAL_CONCEPTS, INITIAL_EDGES } from "../graph/topology";

export const SEED_COURSE_MATERIALS: CourseMaterial[] = [
  {
    id: "ds_algo_syllabus",
    title: "CS 201: Advanced Data Structures & Graph Algorithms",
    subject: "Computer Science",
    content: `
Module 1: Foundations of Program Execution
Memory allocation defines where data lives. Stack allocation holds function execution frames, local primitives, and return addresses in LIFO order. Heap allocation holds dynamically allocated objects accessed via references/pointers.

Module 2: Execution Scope and Call Stacks
When a function is called, the runtime pushes an activation record (stack frame) containing parameters and local variables. When child functions or recursive calls are triggered, the parent frame remains suspended in memory until the child completes and returns.

Module 3: Inductive Recursion
Recursive problem-solving decomposes a problem into smaller instances of itself with a termination base case. Recursion works because the call stack independently preserves the state of every unfinished invocation.

Module 4: Hierarchical & Non-Linear Graph Traversal
Binary tree traversals apply recursive descent over left and right subtrees. Graph traversals (DFS) extend tree traversal to general topologies using adjacency structures and visited-state tracking to prevent infinite cycles.
    `,
    extractedConcepts: [
      "memory_allocation",
      "functions_context",
      "call_stack",
      "recursion",
      "tree_traversal",
      "graph_traversal",
      "dynamic_programming",
    ],
  },
];

export interface DemoInvestigationSeed {
  sessionId: string;
  conceptId: string;
  conceptName: string;
  questionText: string;
  writtenInput: string;
  codeInput: string;
  responseType: "written" | "code" | "mcq" | "steps" | "quiz";
}

export const SEED_DEMO_INVESTIGATION: DemoInvestigationSeed = {
  sessionId: "demo_dfs",
  conceptId: "graph_traversal",
  conceptName: "Graph Traversal (DFS)",
  questionText:
    "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?",
  writtenInput:
    "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3.",
  codeInput: `function dfs(node, visited) {
  visited.add(node);
  for (let neighbor of node.neighbors) {
    if (!visited.has(neighbor)) {
      return dfs(neighbor, visited);
    }
  }
}`,
  responseType: "written",
};

export const SEED_LEARNER_STATES: LearnerConceptState[] = [
  {
    conceptId: "memory_allocation",
    masteryScore: 95,
    status: "mastered",
    confidence: 90,
    recoveryAttempts: 0,
  },
  {
    conceptId: "functions_context",
    masteryScore: 88,
    status: "mastered",
    confidence: 85,
    recoveryAttempts: 0,
  },
  {
    conceptId: "call_stack",
    masteryScore: 40,
    status: "root_gap_identified",
    confidence: 85,
    diagnosticEvidence: [
      "functions_context: Passed (+45%)",
      "call_stack: Failed (+45%)"
    ],
    recoveryAttempts: 0,
  },
  {
    conceptId: "recursion",
    masteryScore: 65,
    status: "untested",
    confidence: 50,
    recoveryAttempts: 0,
  },
  {
    conceptId: "tree_traversal",
    masteryScore: 70,
    status: "untested",
    confidence: 60,
    recoveryAttempts: 0,
  },
  {
    conceptId: "graph_traversal",
    masteryScore: 40,
    status: "misconception_detected",
    activeMisconceptionId: "rec_context_replace",
    confidence: 94,
    recoveryAttempts: 0,
  },
  {
    conceptId: "dynamic_programming",
    masteryScore: 20,
    status: "untested",
    confidence: 10,
    recoveryAttempts: 0,
  },
];

export const SEED_MISCONCEPTIONS: Misconception[] = [
  {
    id: "rec_context_replace",
    conceptId: "graph_traversal",
    name: "Recursive Context Replacement",
    description: "Believing that a recursive function invocation overwrites or replaces the caller's execution environment.",
    studentAssumption: "When dfs(neighbor) is called, it replaces the current function. Once neighbor finishes, the function exits entirely or forgets where it was in the loop.",
    formalReality: "Each recursive invocation pushes a distinct stack frame onto the Call Stack. The parent invocation remains paused in memory. When the child returns, the parent resumes execution with its local variables and loop index exactly as they were.",
    affectedConcepts: ["graph_traversal", "tree_traversal", "recursion", "dynamic_programming"],
    confidence: 94,
    evidence: "Student stated: 'Once dfs() calls itself on node 2, it overwrites node 1, so it cannot go back to explore other neighbors.'",
  },
  {
    id: "pass_by_val_aliasing",
    conceptId: "memory_allocation",
    name: "Object Assignment Duplication Fallacy",
    description: "Believing that assigning an array or object to a new variable creates an isolated duplicate.",
    studentAssumption: "Writing visited_copy = visited creates a new independent set in memory, so changes to one do not alter the other.",
    formalReality: "In modern programming languages, object and array variables store memory references. Assigning a reference copies the pointer, not the underlying heap data.",
    affectedConcepts: ["graph_traversal", "memory_allocation"],
    confidence: 89,
    evidence: "Student claimed modifications inside helper functions wouldn't mutate the parent visited array.",
  },
];

export const SEED_DIAGNOSTIC_PROBES: DiagnosticProbe[] = [
  {
    id: "probe_tree_traversal_state",
    conceptId: "tree_traversal",
    targetConceptId: "graph_traversal",
    question: "During binary tree recursive traversal (DFS), when traverse(node.left) finishes, how does the program know where node.right is located?",
    options: [
      {
        id: "tt_opt_1",
        text: "The left child return unwinds back to the parent frame, which still holds the original node reference to call traverse(node.right).",
        isCorrect: true,
        indicator: "Understands tree recursive sub-branch return flow.",
      },
      {
        id: "tt_opt_2",
        text: "The program loses the parent node once the left child completes, terminating the entire tree traversal.",
        isCorrect: false,
        indicator: "Believes tree traversal child calls destroy parent context.",
      },
    ],
    invariantTested: "Tree traversal parent context retention across child branches.",
    rationale: "Tests whether the learner understands hierarchical sub-problem resumption before graph cycles.",
  },
  {
    id: "probe_recursion_state",
    conceptId: "recursion",
    targetConceptId: "graph_traversal",
    question: "In a recursive function that has a loop calling itself (like visiting all neighbors in DFS), what happens to the loop in the parent function when the child call finishes?",
    options: [
      {
        id: "rec_opt_1",
        text: "The parent function loop terminates immediately because the child call was the final action.",
        isCorrect: false,
        indicator: "Believes recursion aborts caller loop execution.",
      },
      {
        id: "rec_opt_2",
        text: "The parent function resumes its loop at the exact next iteration, retaining all its local variables.",
        isCorrect: true,
        indicator: "Understands recursive return semantics.",
      },
      {
        id: "rec_opt_3",
        text: "The parent function restarts from the very beginning of the loop with reset variables.",
        isCorrect: false,
        indicator: "Believes recursion resets caller local state.",
      },
    ],
    invariantTested: "Recursive function resumption after child return.",
    rationale: "Tests whether the student understands that child recursion pauses rather than destroys caller loops.",
  },
  {
    id: "probe_call_stack_frames",
    conceptId: "call_stack",
    targetConceptId: "graph_traversal",
    question: "When function A calls function B, and function B calls function C, where do the local variables of function A reside while function C is currently executing?",
    options: [
      {
        id: "cs_opt_1",
        text: "They are overwritten by function C's variables to conserve computer memory.",
        isCorrect: false,
        indicator: "Believes stack memory is a single shared mutable block that gets overwritten.",
      },
      {
        id: "cs_opt_2",
        text: "They are preserved in A's own dedicated stack frame underneath B and C on the Call Stack.",
        isCorrect: true,
        indicator: "Accurate mental model of Call Stack LIFO activation records.",
      },
      {
        id: "cs_opt_3",
        text: "They are saved to the hard drive and re-loaded when function C finishes.",
        isCorrect: false,
        indicator: "Confusion between virtual memory paging and runtime execution context.",
      },
    ],
    invariantTested: "LIFO Activation Record Preservation in Call Stack.",
    rationale: "Identifies whether the learner understands physical stack frame isolation during nested calls.",
  },
  {
    id: "probe_functions_context",
    conceptId: "functions_context",
    targetConceptId: "graph_traversal",
    question: "If function foo() declares 'let count = 5;' and calls bar(), can bar() directly alter foo's local 'count' variable (assuming it was not passed by reference)?",
    options: [
      {
        id: "fc_opt_1",
        text: "No, foo's local variables are scoped to foo's execution context and protected from bar().",
        isCorrect: true,
        indicator: "Understands lexical scope and activation boundaries.",
      },
      {
        id: "fc_opt_2",
        text: "Yes, all variables in the same file share global execution scope.",
        isCorrect: false,
        indicator: "Lacks lexical scope mental model.",
      },
    ],
    invariantTested: "Function activation boundary and lexical scope.",
    rationale: "Verifies foundational scope understanding before assessing the hardware call stack.",
  },
];

export const SEED_INTERVENTIONS: Record<string, InterventionContent> = {
  call_stack: {
    id: "intervention_call_stack",
    rootConceptId: "call_stack",
    targetConceptId: "graph_traversal",
    title: "Call Stack Activation Records & Frame Isolation",
    explanation:
      "When a program runs, every function call receives its own private room in memory called a 'Stack Frame'. When function foo() calls bar(), foo doesn't disappear or get replaced; it is temporarily frozen. bar() gets stacked on top of foo(). Only when bar() hits 'return' does its frame pop off the stack, seamlessly waking up foo() right where it paused!",
    visualMemoryModel: {
      type: "call_stack",
      title: "Interactive DFS Call Stack Inspector",
      description: "Watch how stack frames stack in LIFO order and unwind without losing local loop variables.",
      frames: [
        {
          step: 1,
          label: "dfs(Node 0) Initiated",
          stackFrames: ["Frame 1: dfs(0) [neighbor_idx: 0]"],
          activeLine: 3,
          explanation: "dfs(0) pushes Frame 1. It begins looping through neighbors [1, 2].",
        },
        {
          step: 2,
          label: "Recursive Call dfs(1)",
          stackFrames: [
            "Frame 2: dfs(1) [neighbor_idx: 0] (Active)",
            "Frame 1: dfs(0) [neighbor_idx: 0] (Paused)",
          ],
          activeLine: 6,
          explanation: "dfs(1) is pushed ON TOP of dfs(0). Frame 1 is NOT replaced; it pauses at neighbor_idx: 0.",
        },
        {
          step: 3,
          label: "dfs(1) Finishes & Pops",
          stackFrames: ["Frame 1: dfs(0) [neighbor_idx: 1] (Resumed)"],
          activeLine: 8,
          explanation: "Frame 2 returns and pops. Frame 1 resumes instantly and advances to neighbor_idx: 1 (Node 2)!",
        },
      ],
    },
    counterexample: {
      title: "The Counterexample: Why Values Are Never Overwritten",
      code: `function traverse(depth) {\n  let localStep = "Step " + depth;\n  if (depth < 2) {\n    traverse(depth + 1);\n  }\n  console.log(localStep); // If replaced, this would print 'Step 2' for all!\n}\ntraverse(1);\n// OUTPUT:\n// Step 2\n// Step 1`,
      expectedOutput: "Step 2\nStep 1",
      actualOutput: "Step 2\nStep 1",
      mentalModelExplanation:
        "Notice that 'Step 1' prints AFTER 'Step 2'! If the recursive call had overwritten the function, 'Step 1' would have been permanently destroyed. Instead, it was safely preserved on the Call Stack!",
    },
    microPuzzle: {
      question: "Look at the code below. What will be the LAST line printed to the console?",
      codeSnippet: `function countdown(n) {\n  if (n === 0) return;\n  countdown(n - 1);\n  console.log("Unwound: " + n);\n}\ncountdown(3);`,
      options: [
        "Unwound: 0",
        "Unwound: 1",
        "Unwound: 3",
        "Error: Stack overflow",
      ],
      correctIndex: 2,
      explanation:
        "Because countdown(3) was pushed first, it is popped LAST when the stack unwinds! So 'Unwound: 3' prints last.",
    },
    codeExercise: {
      instructions:
        "Fix the recursive helper to ensure the parent's loop state is not bypassed. Return the collected path after both branches return.",
      initialCode: `function dfs(node, visited, path) {\n  visited.add(node);\n  path.push(node);\n  for (let neighbor of node.neighbors) {\n    if (!visited.has(neighbor)) {\n      // BUG: The student wrote return here, aborting other neighbors!\n      return dfs(neighbor, visited, path);\n    }\n  }\n  return path;\n}`,
      expectedPattern: "dfs(neighbor, visited, path);",
      solutionCode: `function dfs(node, visited, path) {\n  visited.add(node);\n  path.push(node);\n  for (let neighbor of node.neighbors) {\n    if (!visited.has(neighbor)) {\n      dfs(neighbor, visited, path);\n    }\n  }\n  return path;\n}`,
      hints: [
        "Remove the early 'return' inside the for-loop so subsequent neighbors are visited after the recursive call returns.",
      ],
    },
    industryBlastRadius: {
      incidentTitle: "Microservice Crash in Nested JSON Parsing Engine",
      organizationType: "Cloud Financial Gateway",
      outageDescription:
        "A distributed transaction router experienced cascading process crashes under peak load due to an unmetered recursive tree parser.",
      howMisconceptionCausesIt:
        "Engineers who believe recursive calls overwrite previous memory often assume recursion has $O(1)$ memory overhead. In reality, deeply nested payloads push hundreds of thousands of stack frames, exhausting the thread's memory limit and triggering an uncatchable StackOverflowError.",
      illustrativeNote:
        "Illustrative Consequence: Demonstrates why understanding physical Call Stack memory frames is critical in production engineering.",
    },
  },
  memory_allocation: {
    id: "intervention_memory_allocation",
    rootConceptId: "memory_allocation",
    targetConceptId: "graph_traversal",
    title: "Heap References vs Deep Value Cloning",
    explanation:
      "In modern programming languages, complex objects, sets, and arrays do not fit into single CPU registers. Instead, they reside on the Heap, while variables only hold a 64-bit Memory Address Pointer (e.g., 0x7FFF). When you write `let copy = original;`, you do NOT duplicate the data—you only duplicate the pointer! Mutating data through `copy` mutates the exact same physical heap block that `original` points to.",
    visualMemoryModel: {
      type: "heap_pointers",
      title: "Interactive Heap Reference vs Clone Inspector",
      description: "Observe how reference assignment points two variables to the same physical memory address in the heap.",
      frames: [
        {
          step: 1,
          label: "Heap Allocation: visited = new Set([0])",
          stackFrames: ["Stack: visited -> 0x7FFA (Heap: Set{0})"],
          activeLine: 1,
          explanation: "Memory is allocated in the heap at address 0x7FFA. Variable `visited` stores this memory pointer.",
        },
        {
          step: 2,
          label: "Reference Copy: copy = visited",
          stackFrames: [
            "Stack: copy -> 0x7FFA (Points to SAME Heap Block)",
            "Stack: visited -> 0x7FFA (Original Pointer)",
          ],
          activeLine: 2,
          explanation: "No new set was cloned! Variable `copy` simply receives a copy of the 0x7FFA address pointer.",
        },
        {
          step: 3,
          label: "Mutation: copy.add(1)",
          stackFrames: ["Heap 0x7FFA mutated! Both variables now see Set{0, 1}."],
          activeLine: 3,
          explanation: "Mutating `copy` alters the memory block at 0x7FFA. Inspecting `visited` now also reveals Set{0, 1}!",
        },
      ],
    },
    counterexample: {
      title: "The Counterexample: Modifying an Aliased Array",
      code: `let original = [1, 2];\nlet alias = original; // Only copies the memory reference\nalias.push(99);\nconsole.log(original); // Prints [1, 2, 99]!\n// To clone properly: let actualClone = [...original];`,
      expectedOutput: "[1, 2, 99]",
      actualOutput: "[1, 2, 99]",
      mentalModelExplanation:
        "Notice that modifying `alias` directly mutated `original`! If `alias = original` had cloned the array, `original` would still be [1, 2]. To clone an independent instance, you must explicitly copy the contents via spread syntax or structuredClone().",
    },
    microPuzzle: {
      question: "Look at the snippet below. What does `visited.has(2)` evaluate to?",
      codeSnippet: `let visited = new Set([1]);\nlet shadow = visited;\nshadow.add(2);\nconsole.log(visited.has(2));`,
      options: [
        "true — because shadow and visited reference the same heap Set.",
        "false — because shadow is a separate clone.",
        "undefined — sets cannot be modified through aliases.",
        "TypeError — sets cannot be assigned to multiple variables.",
      ],
      correctIndex: 0,
      explanation:
        "Correct! Because `shadow` and `visited` share the identical memory reference address, mutating `shadow` modifies `visited` directly.",
    },
    codeExercise: {
      instructions:
        "Fix the snapshot generator to create an isolated, cloned Set instead of sharing the reference with the caller.",
      initialCode: `function snapshotVisited(visitedSet) {\n  // BUG: Reference assignment causes external mutations to leak!\n  let copy = visitedSet;\n  return copy;\n}`,
      expectedPattern: "new Set(visitedSet)",
      solutionCode: `function snapshotVisited(visitedSet) {\n  let copy = new Set(visitedSet);\n  return copy;\n}`,
      hints: [
        "Use `new Set(visitedSet)` or spread `[...visitedSet]` to allocate an isolated memory instance on the heap.",
      ],
    },
    industryBlastRadius: {
      incidentTitle: "State Mutation & Race Condition in Real-Time Trading Engine",
      organizationType: "FinTech Exchange & Matching Engine",
      outageDescription:
        "A distributed order matching platform suffered state corruption when an internal risk-check service modified an aliased trade payload before submission to the settlement ledger.",
      howMisconceptionCausesIt:
        "Developers assumed that passing an order object into an analytics function operated on an immutable copy. The analytics function modified order flags in place, causing the order to settle at corrupted clearing prices across client accounts.",
      illustrativeNote:
        "Illustrative Consequence: Demonstrates why reference aliasing versus deep value copying is critical in high-reliability software architecture.",
    },
  },
  recursion: {
    id: "intervention_recursion",
    rootConceptId: "recursion",
    targetConceptId: "graph_traversal",
    title: "Recursive Unwinding & Return Value Bubbling",
    explanation:
      "A recursive function achieves results by dividing work into smaller identical subproblems until hitting a base case. A common misconception is believing that when the base case returns, the answer magically appears at the top level. In reality, the return value must be received, processed, and passed upward by EVERY activation frame as the stack unwinds!",
    visualMemoryModel: {
      type: "tree_recursion",
      title: "Interactive Recursive Bubbling Inspector",
      description: "Observe how return values bubble step-by-step upward through returning activation records.",
      frames: [
        {
          step: 1,
          label: "Base Case Reached: solve(0) = 1",
          stackFrames: ["Frame 3: solve(0) returns 1", "Frame 2: solve(1) waiting", "Frame 1: solve(2) waiting"],
          activeLine: 2,
          explanation: "solve(0) hits the base case. It pops from the stack and hands 1 back to Frame 2.",
        },
        {
          step: 2,
          label: "Frame 2 Multiplies: 1 * 1 = 1",
          stackFrames: ["Frame 2: solve(1) returns 1", "Frame 1: solve(2) waiting"],
          activeLine: 4,
          explanation: "Frame 2 receives 1, multiplies by 1, and hands 1 back to Frame 1.",
        },
        {
          step: 3,
          label: "Frame 1 Computes Final Result: 2 * 1 = 2",
          stackFrames: ["Frame 1: solve(2) returns 2 to caller"],
          activeLine: 4,
          explanation: "Frame 1 receives 1, multiplies by 2, and returns the final value 2 to the caller!",
        },
      ],
    },
    counterexample: {
      title: "The Counterexample: Why Forgetting 'return' Yields undefined",
      code: `function findNode(node, target) {\n  if (!node) return null;\n  if (node.val === target) return node;\n  // BUG: Calling findNode without returning its result:\n  findNode(node.left, target);\n}\nconsole.log(findNode(root, 5)); // Prints undefined even when 5 exists!`,
      expectedOutput: "undefined",
      actualOutput: "undefined",
      mentalModelExplanation:
        "The child frame successfully found the node and returned it, but because the parent frame didn't say `return findNode(...)`, the returned value was dropped on the floor and the parent fell through to undefined!",
    },
    microPuzzle: {
      question: "A student writes `function sum(n) { if (n<=1) return 1; sum(n-1) + n; }`. What does `sum(3)` return?",
      codeSnippet: `function sum(n) {\n  if (n <= 1) return 1;\n  sum(n - 1) + n; // Notice missing return keyword!\n}\nconsole.log(sum(3));`,
      options: [
        "undefined — because the recursive branch calculated the sum but forgot to return it.",
        "6 — because JavaScript automatically returns the last evaluated expression.",
        "1 — because only the base case has a return keyword.",
        "NaN — mathematical expressions cannot execute recursively.",
      ],
      correctIndex: 0,
      explanation:
        "Correct! Without the `return` keyword in the recursive step, the calculated sum is discarded and the function implicitly returns `undefined`.",
    },
    codeExercise: {
      instructions:
        "Add the missing `return` statement so the recursive search result bubbles up to the caller.",
      initialCode: `function containsValue(node, target) {\n  if (!node) return false;\n  if (node.value === target) return true;\n  // Fix: return the recursive exploration of left or right\n  containsValue(node.left, target) || containsValue(node.right, target);\n}`,
      expectedPattern: "return containsValue(node.left, target)",
      solutionCode: `function containsValue(node, target) {\n  if (!node) return false;\n  if (node.value === target) return true;\n  return containsValue(node.left, target) || containsValue(node.right, target);\n}`,
      hints: [
        "Ensure you prefix the recursive calls with `return` so the boolean result reaches the top-level caller.",
      ],
    },
    industryBlastRadius: {
      incidentTitle: "Silent Cache Eviction Failure in Content Delivery Network",
      organizationType: "Global Cloud CDN & Edge Router",
      outageDescription:
        "An edge invalidation service failed to clear cached media across hierarchically partitioned cache nodes, delivering stale content globally.",
      howMisconceptionCausesIt:
        "A developer implemented a recursive cache-tree purge but omitted the return value bubbling from child shards. The master coordinator assumed all purges succeeded because no error was thrown, even though branch invalidations returned undefined.",
      illustrativeNote:
        "Illustrative Consequence: Highlights the importance of strict recursive return bubbling in distributed system control planes.",
    },
  },
};

export const SEED_RETEST_ASSESSMENTS: Record<string, ReTestAssessment> = {
  call_stack: {
    id: "retest_call_stack_1",
    conceptId: "call_stack",
    question:
      "A recursive function 'solve(depth)' is called with depth=1. It recurses to depth=2, which then recurses to depth=3. At the exact moment depth=3 is executing its base case, how many activation frames exist on the call stack?",
    codeSnippet: `function solve(depth) {\n  if (depth === 3) return true;\n  return solve(depth + 1);\n}`,
    options: [
      {
        id: "rt_1",
        text: "1 frame, because each call replaces the previous one.",
        isCorrect: false,
        feedback: "Incorrect. Remember the LIFO principle: parent frames remain active on the stack.",
      },
      {
        id: "rt_2",
        text: "3 frames: solve(1) at bottom, solve(2) in middle, solve(3) at top.",
        isCorrect: true,
        feedback: "Correct! All three invocations hold dedicated, isolated stack frames.",
      },
      {
        id: "rt_3",
        text: "0 frames, because recursion executes purely in heap registers.",
        isCorrect: false,
        feedback: "Incorrect. Function invocations always allocate on the hardware runtime stack.",
      },
    ],
  },
  memory_allocation: {
    id: "retest_memory_allocation_1",
    conceptId: "memory_allocation",
    question:
      "You have an array `let a = [10, 20];`. You write `let b = a; b[0] = 99;`. What will `console.log(a[0])` output?",
    codeSnippet: `let a = [10, 20];\nlet b = a;\nb[0] = 99;\nconsole.log(a[0]);`,
    options: [
      {
        id: "ma_1",
        text: "99 — because both 'a' and 'b' store pointers referencing the identical array in heap memory.",
        isCorrect: true,
        feedback: "Correct! Variable assignment copies the memory reference, not the underlying array.",
      },
      {
        id: "ma_2",
        text: "10 — because 'let b = a' creates an independent duplicate copy.",
        isCorrect: false,
        feedback: "Incorrect. In JavaScript/Python, assigning non-primitives copies only the reference.",
      },
      {
        id: "ma_3",
        text: "undefined — arrays cannot be mutated through assigned variables.",
        isCorrect: false,
        feedback: "Incorrect. Aliased variables can freely mutate the shared heap instance.",
      },
    ],
  },
  recursion: {
    id: "retest_recursion_1",
    conceptId: "recursion",
    question:
      "When a recursive function reaches its base case and returns a value, how does that value reach the initial caller function at the top level?",
    codeSnippet: `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}`,
    options: [
      {
        id: "rec_1",
        text: "It returns step-by-step upward through each paused parent stack frame until reaching the initial caller.",
        isCorrect: true,
        feedback: "Correct! Stack unwinding passes returns sequentially up the activation chain.",
      },
      {
        id: "rec_2",
        text: "It bypasses all intermediate functions and jumps directly into the global execution register.",
        isCorrect: false,
        feedback: "Incorrect. Execution must adhere to strict call-stack unwinding order.",
      },
      {
        id: "rec_3",
        text: "It overwrites all previous local variables with the base case return value.",
        isCorrect: false,
        feedback: "Incorrect. Each stack frame retains its own private local variables.",
      },
    ],
  },
};
