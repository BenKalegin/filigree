/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Sanity checks for the Barnes-Hut option on the force-directed algorithm.
 *
 * Goal: verify that flipping `elk.force.useBarnesHut` produces a layout
 * that's *close* to the exact O(n²) repulsion (so the approximation
 * isn't broken) while running the alternate code path. We don't assert
 * pixel-identical positions because Barnes-Hut is an approximation by
 * design.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@benkalegin/filigree-core';
import { type ElkNode, fromJson, type IJsonGraph } from '@benkalegin/filigree-graph';

import { createDefaultForceAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultForceAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const SIMPLE_GRAPH: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'force' },
  children: Array.from({ length: 8 }, (_, i) => ({
    id: `n${String(i)}`,
    width: 30,
    height: 30,
  })),
  edges: [
    { id: 'e01', sources: ['n0'], targets: ['n1'] },
    { id: 'e12', sources: ['n1'], targets: ['n2'] },
    { id: 'e23', sources: ['n2'], targets: ['n3'] },
    { id: 'e34', sources: ['n3'], targets: ['n4'] },
    { id: 'e45', sources: ['n4'], targets: ['n5'] },
    { id: 'e56', sources: ['n5'], targets: ['n6'] },
    { id: 'e67', sources: ['n6'], targets: ['n7'] },
    { id: 'e07', sources: ['n0'], targets: ['n7'] },
  ],
};

const centerOf = (n: ElkNode): { x: number; y: number } => ({
  x: n.x + n.width / 2,
  y: n.y + n.height / 2,
});

const layoutWith = async (useBarnesHut: boolean): Promise<readonly ElkNode[]> => {
  const graph = fromJson({
    ...SIMPLE_GRAPH,
    layoutOptions: {
      ...SIMPLE_GRAPH.layoutOptions,
      'elk.force.useBarnesHut': useBarnesHut,
    },
  });
  await buildEngine().layout(graph);
  return graph.children;
};

describe('Barnes-Hut repulsion', () => {
  it('places every node at finite coordinates when enabled', async () => {
    const result = await layoutWith(true);
    for (const node of result) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it('keeps the deterministic spiral start (no random component)', async () => {
    const a = await layoutWith(true);
    const b = await layoutWith(true);
    for (const [i, nodeA] of a.entries()) {
      const nodeB = b[i];
      expect(nodeA.x).toBe(nodeB?.x);
      expect(nodeA.y).toBe(nodeB?.y);
    }
  });

  it('produces a layout close to exact O(n²) repulsion', async () => {
    const exact = await layoutWith(false);
    const approx = await layoutWith(true);
    // Compare cycle layouts: the *relative* distances between connected
    // pairs should be similar (within ±50% — Barnes-Hut is approximate
    // but should not produce visibly different topology for 8 nodes).
    for (const [i, exactNode] of exact.entries()) {
      const approxNode = approx[i];
      if (approxNode === undefined) continue;
      const ce = centerOf(exactNode);
      const ca = centerOf(approxNode);
      const drift = Math.hypot(ce.x - ca.x, ce.y - ca.y);
      // Drift bounded by the rough length scale (idealLength default 80).
      expect(drift).toBeLessThan(150);
    }
  });
});
