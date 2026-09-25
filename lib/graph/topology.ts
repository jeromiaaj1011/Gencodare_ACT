import { Concept, ConceptEdge } from "../types";

export const INITIAL_CONCEPTS: Concept[] = [
  {
    id: "memory_allocation",
    name: "Memory & Pointers",
    category: "Foundations",
    description: "Understanding stack vs heap memory, references, and pointer dereferencing.",
    prerequisites: [],
    difficulty: "beginner",
    estimatedMinutes: 20,
  },
  {
    id: "functions_context",
    name: "Function Invocation & Scope",
    category: "Foundations",
    description: "Scope, lexical environments, variable lifetime, and parameter passing.",
    prerequisites: ["memory_allocation"],
    difficulty: "beginner",
    estimatedMinutes: 25,
  },
  {
    id: "call_stack",
    name: "Call Stack & LIFO Frames",
    category: "Architecture",
    description: "Pushing and popping stack frames, return address storage, and local variable retention during nested calls.",
    prerequisites: ["functions_context"],
    difficulty: "intermediate",
    estimatedMinutes: 35,
  },
  {
    id: "recursion",
    name: "Recursion & Base Invariants",
    category: "Algorithms",
    description: "Self-referential algorithms, base cases, and inductive step progress through stack frame unwinding.",
    prerequisites: ["call_stack"],
    difficulty: "intermediate",
    estimatedMinutes: 40,
  },
  {
    id: "tree_traversal",
    name: "Binary Tree Traversal",
    category: "Data Structures",
    description: "Depth-first visits (Preorder, Inorder, Postorder) over hierarchical tree nodes utilizing recursive sub-problems.",
    prerequisites: ["recursion"],
    difficulty: "intermediate",
    estimatedMinutes: 45,
  },
  {
    id: "graph_traversal",
    name: "Graph Traversal (DFS & BFS)",
    category: "Algorithms",
    description: "Navigating arbitrary graph topologies, cyclic edge handling, visited sets, and recursive DFS exploration.",
    prerequisites: ["tree_traversal"],
    difficulty: "advanced",
    estimatedMinutes: 50,
  },
  {
    id: "dynamic_programming",
    name: "Dynamic Programming & Memoization",
    category: "Advanced Algorithms",
    description: "Overlapping subproblems, optimal substructure, and caching intermediate recursion tree states.",
    prerequisites: ["graph_traversal", "recursion"],
    difficulty: "advanced",
    estimatedMinutes: 60,
  },
];

export const INITIAL_EDGES: ConceptEdge[] = [
  {
    from: "memory_allocation",
    to: "functions_context",
    rationale: "Function invocations require understanding where parameters and local variables reside in memory.",
  },
  {
    from: "functions_context",
    to: "call_stack",
    rationale: "Nested function calls require a hardware/runtime mechanism (Call Stack) to retain execution context and return addresses.",
  },
  {
    from: "call_stack",
    to: "recursion",
    rationale: "Without understanding that each recursive call preserves its own stack frame, learners mistakenly believe recursive calls overwrite previous local state.",
  },
  {
    from: "recursion",
    to: "tree_traversal",
    rationale: "Traversing left and right subtrees relies entirely on the call stack maintaining independent state for parent nodes while traversing children.",
  },
  {
    from: "tree_traversal",
    to: "graph_traversal",
    rationale: "Graphs generalize trees with potential cycles; understanding tree recursion is essential before handling graph visited-state tracking.",
  },
  {
    from: "graph_traversal",
    to: "dynamic_programming",
    rationale: "Dynamic programming state transition graphs represent directed acyclic graphs (DAGs) of recursive subproblems.",
  },
];
