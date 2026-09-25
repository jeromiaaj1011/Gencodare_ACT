import { Concept, ConceptEdge } from "../types";

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  layer: number;
}

export function computeHierarchicalLayout(
  concepts: Concept[],
  edges: ConceptEdge[],
  canvasWidth = 1000,
  canvasHeight = 550
): { positions: Map<string, NodePosition>; width: number; height: number } {
  const nodeMap = new Map(concepts.map((c) => [c.id, c]));
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

  // Layer assignment using longest path from root
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

  // Ensure every node has a layer
  for (const c of concepts) {
    if (!layers.has(c.id)) {
      layers.set(c.id, 0);
    }
  }

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  let maxLayer = 0;
  for (const [id, layer] of layers.entries()) {
    if (layer > maxLayer) maxLayer = layer;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(id);
  }

  // Calculate coordinates
  const positions = new Map<string, NodePosition>();
  const horizontalPadding = 120;
  const verticalPadding = 90;
  const usableWidth = canvasWidth - horizontalPadding * 2;
  const colWidth = maxLayer > 0 ? usableWidth / maxLayer : usableWidth;

  for (let l = 0; l <= maxLayer; l++) {
    const nodesInLayer = layerGroups.get(l) || [];
    const count = nodesInLayer.length;
    const usableHeight = canvasHeight - verticalPadding * 2;
    const rowHeight = count > 1 ? usableHeight / (count - 1) : 0;

    nodesInLayer.forEach((nodeId, idx) => {
      const x = horizontalPadding + l * colWidth;
      const y =
        count === 1
          ? canvasHeight / 2
          : verticalPadding + idx * rowHeight;

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
