/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@benkalegin/filigree-core';
import { type ElkNode, fromJson, type IJsonGraph } from '@benkalegin/filigree-graph';

import { createDefaultRadialAlgorithm, RADIAL_ALGORITHM_ID } from '../src/index.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultRadialAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

const center = (n: ElkNode): { x: number; y: number } => ({
  x: n.x + n.width / 2,
  y: n.y + n.height / 2,
});

const TREE: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': RADIAL_ALGORITHM_ID },
  children: [
    { id: 'r', width: 40, height: 40 },
    { id: 'a', width: 40, height: 30 },
    { id: 'b', width: 40, height: 30 },
    { id: 'c', width: 40, height: 30 },
    { id: 'd', width: 40, height: 30 },
  ],
  edges: [
    { id: 'ra', sources: ['r'], targets: ['a'] },
    { id: 'rb', sources: ['r'], targets: ['b'] },
    { id: 'rc', sources: ['r'], targets: ['c'] },
    { id: 'rd', sources: ['r'], targets: ['d'] },
  ],
};

describe('RadialAlgorithm', () => {
  it('keeps the root and its children at distinct radii from the layout origin', async () => {
    const graph = fromJson(TREE);
    await buildEngine().layout(graph);

    // Engine's bbox-fit shifts everything into the positive quadrant; pick
    // any leaf and compute its distance from the root's center.
    const r = findById(graph, 'r');
    const a = findById(graph, 'a');
    const rc = center(r);
    const ac = center(a);
    const distance = Math.hypot(ac.x - rc.x, ac.y - rc.y);
    // Children sit one radius increment away (default 100); allow a small
    // tolerance for fp arithmetic.
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(200);
  });

  it('distributes 4 children at distinct angles (no overlap at the root)', async () => {
    const graph = fromJson(TREE);
    await buildEngine().layout(graph);

    const r = findById(graph, 'r');
    const rc = center(r);
    const angles = ['a', 'b', 'c', 'd'].map((id) => {
      const c = center(findById(graph, id));
      return Math.atan2(c.y - rc.y, c.x - rc.x);
    });
    // Each pair of adjacent angles should differ — no two children at the same angle.
    const unique = new Set(angles.map((a) => a.toFixed(3)));
    expect(unique.size).toBe(4);
  });
});
