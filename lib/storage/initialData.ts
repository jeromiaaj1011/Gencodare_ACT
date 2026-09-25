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
    masteryScore: 50,
    status: "untested",
    confidence: 45,
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
    status: "untested",
    confidence: 30,
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
};
