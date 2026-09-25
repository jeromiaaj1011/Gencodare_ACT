import { Concept, ConceptEdge } from "../types";

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  layer: number;
}

// Tailored baseline 2D coordinates for the core CS Causal DAG to create an organic, beautiful multi-branching network
const CURATED_2D_POSITIONS: Record<string, { x: number; y: number; layer: number }> = {
  memory_allocation: { x: 130, y: 170, layer: 0 },
  functions_context: { x: 180, y: 410, layer: 0 },
  call_stack: { x: 390, y: 250, layer: 1 },
  recursion: { x: 590, y: 340, layer: 2 },
  tree_traversal: { x: 770, y: 170, layer: 3 },
  graph_traversal: { x: 920, y: 260, layer: 4 },
  dynamic_programming: { x: 1060, y: 430, layer: 5 },
};

export function computeHierarchicalLayout(
  concepts: Concept[],
  edges: ConceptEdge[],
  canvasWidth = 1180,
  canvasHeight = 600
): { positions: Map<string, NodePosition>; width: number; height: number } {
  const positions = new Map<string, NodePosition>();

  // Check if this matches the core concepts
  const isCoreGraph =
    concepts.length === 7 &&
    concepts.every((c) => CURATED_2D_POSITIONS[c.id] !== undefined);

  if (isCoreGraph) {
    for (const c of concepts) {
      const p = CURATED_2D_POSITIONS[c.id];
      positions.set(c.id, {
        id: c.id,
        x: p.x,
        y: p.y,
        layer: p.layer,
      });
    }
    return { positions, width: canvasWidth, height: canvasHeight };
  }

  // Generalized 2D topological layout with barycenter heuristic for custom/extracted concepts
  const inDegree = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();

  for (const c of concepts) {
    inDegree.set(c.id, 0);
    childrenMap.set(c.id, []);
  }

  for (const edge of edges) {
    if (inDegree.has(edge.to)) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }
    childrenMap.get(edge.from)?.push(edge.to);
  }

  // Layer assignment using longest path
  const layers = new Map<string, number>();
  const roots = concepts.filter((c) => (inDegree.get(c.id) || 0) === 0);

  const assignLayer = (currId: string, depth: number) => {
    const existing = layers.get(currId) || 0;
    if (depth > existing) {
      layers.set(currId, depth);
    }
    const children = childrenMap.get(currId) || [];
    for (const child of children) {
      assignLayer(child, depth + 1);
    }
  };

  for (const r of roots) {
    assignLayer(r.id, 0);
  }

  for (const c of concepts) {
    if (!layers.has(c.id)) {
      layers.set(c.id, 0);
    }
  }

  const layerGroups = new Map<number, string[]>();
  let maxLayer = 0;
  for (const [id, layer] of layers.entries()) {
    if (layer > maxLayer) maxLayer = layer;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(id);
  }

  const horizontalPadding = 140;
  const verticalPadding = 110;
  const usableWidth = canvasWidth - horizontalPadding * 2;
  const colWidth = maxLayer > 0 ? usableWidth / maxLayer : usableWidth;

  for (let l = 0; l <= maxLayer; l++) {
    const nodesInLayer = layerGroups.get(l) || [];
    const count = nodesInLayer.length;
    const usableHeight = canvasHeight - verticalPadding * 2;

    nodesInLayer.forEach((nodeId, idx) => {
      // If curated coordinate exists for this node, use it with responsive scale
      if (CURATED_2D_POSITIONS[nodeId]) {
        positions.set(nodeId, {
          id: nodeId,
          x: CURATED_2D_POSITIONS[nodeId].x,
          y: CURATED_2D_POSITIONS[nodeId].y,
          layer: CURATED_2D_POSITIONS[nodeId].layer,
        });
        return;
      }

      const x = horizontalPadding + l * colWidth;
      // Stagger single nodes using alternating wave to avoid flat horizontal lines
      let y: number;
      if (count === 1) {
        y = l % 2 === 0 ? canvasHeight / 2 - 60 : canvasHeight / 2 + 70;
      } else {
        const rowHeight = usableHeight / (count - 1);
        y = verticalPadding + idx * rowHeight;
      }

      positions.set(nodeId, {
        id: nodeId,
        x,
        y,
        layer: l,
      });
    });
  }

  return { positions, width: canvasWidth, height: canvasHeight };
}
