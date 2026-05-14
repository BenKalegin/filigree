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

import { createDefaultMrTreeAlgorithm, MRTREE_ALGORITHM_ID } from '../src/index.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultMrTreeAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

const TREE_JSON: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': MRTREE_ALGORITHM_ID },
  children: [
    { id: 'r', width: 60, height: 30, labels: [{ text: 'Root' }] },
    { id: 'a', width: 60, height: 30, labels: [{ text: 'A' }] },
    { id: 'b', width: 60, height: 30, labels: [{ text: 'B' }] },
    { id: 'a1', width: 40, height: 30, labels: [{ text: 'A1' }] },
    { id: 'a2', width: 40, height: 30, labels: [{ text: 'A2' }] },
    { id: 'b1', width: 40, height: 30, labels: [{ text: 'B1' }] },
  ],
  edges: [
    { id: 'e1', sources: ['r'], targets: ['a'] },
    { id: 'e2', sources: ['r'], targets: ['b'] },
    { id: 'e3', sources: ['a'], targets: ['a1'] },
    { id: 'e4', sources: ['a'], targets: ['a2'] },
    { id: 'e5', sources: ['b'], targets: ['b1'] },
  ],
};

const centerX = (n: ElkNode): number => n.x + n.width / 2;

describe('MrTreeAlgorithm', () => {
  it('places leaves left-to-right and centers internal nodes over their children', async () => {
    const graph = fromJson(TREE_JSON);
    await buildEngine().layout(graph);

    const r = findById(graph, 'r');
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const a1 = findById(graph, 'a1');
    const a2 = findById(graph, 'a2');
    const b1 = findById(graph, 'b1');

    // Levels — top row is root, next is its children, next is grandchildren.
    expect(r.y).toBeLessThan(a.y);
    expect(a.y).toBe(b.y); // siblings at same level
    expect(a.y).toBeLessThan(a1.y);
    expect(a1.y).toBe(a2.y);
    expect(a1.y).toBe(b1.y); // grandchildren all at the same level

    // Leaf order: a1 left of a2 left of b1.
    expect(a1.x).toBeLessThan(a2.x);
    expect(a2.x).toBeLessThan(b1.x);

    // Internal nodes centered over their children.
    expect(centerX(a)).toBeCloseTo((centerX(a1) + centerX(a2)) / 2, 6);
    expect(centerX(b)).toBeCloseTo(centerX(b1), 6);
    expect(centerX(r)).toBeCloseTo((centerX(a) + centerX(b)) / 2, 6);
  });

  it('handles a single-node graph (just the root, no edges)', async () => {
    const graph = fromJson({
      id: 'g',
      layoutOptions: { 'elk.algorithm': MRTREE_ALGORITHM_ID },
      children: [{ id: 'only', width: 40, height: 30 }],
    } satisfies IJsonGraph);
    await buildEngine().layout(graph);
    // Engine's bbox fit applies padding to the root, so coords are shifted
    // from MrTree's (0, 0). Just confirm the node has finite coords.
    expect(Number.isFinite(graph.children[0]?.x)).toBe(true);
    expect(Number.isFinite(graph.children[0]?.y)).toBe(true);
  });
});
