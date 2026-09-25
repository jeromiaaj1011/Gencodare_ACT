import { Concept, ConceptEdge, LearnerConceptState } from "../types";

export class DAGEngine {
  private concepts: Map<string, Concept>;
  private edges: ConceptEdge[];
  private adjacencyList: Map<string, string[]>; // from -> to[] (dependents)
  private reverseAdjacencyList: Map<string, string[]>; // to -> from[] (prerequisites)

  constructor(concepts: Concept[], edges: ConceptEdge[]) {
    this.concepts = new Map(concepts.map((c) => [c.id, c]));
    this.edges = edges;
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();

    for (const c of concepts) {
      this.adjacencyList.set(c.id, []);
      this.reverseAdjacencyList.set(c.id, []);
    }

    for (const edge of edges) {
      this.adjacencyList.get(edge.from)?.push(edge.to);
      this.reverseAdjacencyList.get(edge.to)?.push(edge.from);
    }
  }

  public getConcept(id: string): Concept | undefined {
    return this.concepts.get(id);
  }

  public getAllConcepts(): Concept[] {
    return Array.from(this.concepts.values());
  }

  public getAllEdges(): ConceptEdge[] {
    return this.edges;
  }

  /**
   * Returns all ancestor prerequisites of a target concept in topological order
   * (earliest foundational concept first).
   */
  public getAncestorsTopological(targetConceptId: string): Concept[] {
    const visited = new Set<string>();
    const ancestors: string[] = [];

    const dfs = (currId: string) => {
      const prereqs = this.reverseAdjacencyList.get(currId) || [];
      for (const p of prereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          dfs(p);
          ancestors.push(p);
        }
      }
    };

    dfs(targetConceptId);

    // Topological order: foundational first
    return ancestors
      .map((id) => this.concepts.get(id))
      .filter((c): c is Concept => c !== undefined);
  }

  /**
   * Returns the prerequisite chain directly connecting the foundational root to the target concept.
   */
  public getPrerequisitePath(targetConceptId: string): Concept[] {
    const ancestors = this.getAncestorsTopological(targetConceptId);
    const target = this.concepts.get(targetConceptId);
    return target ? [...ancestors, target] : ancestors;
  }

  /**
   * Cognitive Bisect Pivot Selection:
   * Given an unverified set of ancestor candidate concepts, selects the optimal
   * intermediate concept to probe next (e.g. median of the unverified chain).
   */
  public selectBisectPivot(
    candidateIds: string[],
    testedConceptIds: Set<string>
  ): string | undefined {
    const unverified = candidateIds.filter((id) => !testedConceptIds.has(id));
    if (unverified.length === 0) return undefined;

    // Pick the midpoint to achieve O(log N) search depth
    const midIndex = Math.floor(unverified.length / 2);
    return unverified[midIndex];
  }

  /**
   * Computes the personalized adaptive learning path based on learner state.
   * Locked concepts are those whose prerequisites are not yet mastered.
   */
  public computeAdaptivePath(
    learnerStates: Map<string, LearnerConceptState>
  ): {
    conceptId: string;
    status: "ready_to_learn" | "locked" | "needs_recovery" | "mastered";
    blockingPrerequisite?: string;
  }[] {
    const result: {
      conceptId: string;
      status: "ready_to_learn" | "locked" | "needs_recovery" | "mastered";
      blockingPrerequisite?: string;
    }[] = [];

    for (const concept of this.concepts.values()) {
      const state = learnerStates.get(concept.id);
      const isMastered = state?.status === "mastered" || state?.status === "recovered";
      const hasMisconception =
        state?.status === "misconception_detected" ||
        state?.status === "root_gap_identified" ||
        state?.status === "unresolved";

      if (hasMisconception) {
        result.push({ conceptId: concept.id, status: "needs_recovery" });
        continue;
      }

      if (isMastered) {
        result.push({ conceptId: concept.id, status: "mastered" });
        continue;
      }

      // Check if all prerequisites are mastered
      const prereqs = this.reverseAdjacencyList.get(concept.id) || [];
      const unmasteredPrereq = prereqs.find((p) => {
        const pState = learnerStates.get(p);
        return pState?.status !== "mastered" && pState?.status !== "recovered";
      });

      if (unmasteredPrereq) {
        result.push({
          conceptId: concept.id,
          status: "locked",
          blockingPrerequisite: unmasteredPrereq,
        });
      } else {
        result.push({ conceptId: concept.id, status: "ready_to_learn" });
      }
    }

    return result;
  }

  /**
   * Returns the rationale for why concept A is required before B.
   */
  public getEdgeRationale(fromId: string, toId: string): string | undefined {
    const edge = this.edges.find((e) => e.from === fromId && e.to === toId);
    return edge?.rationale;
  }
}
