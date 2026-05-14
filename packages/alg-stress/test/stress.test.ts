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

import { createDefaultStressAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultStressAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) throw new Error(`Node not found: ${id}`);
  return found;
};

const distance = (a: ElkNode, b: ElkNode): number =>
  Math.hypot(a.x + a.width / 2 - (b.x + b.width / 2), a.y + a.height / 2 - (b.y + b.height / 2));

describe('StressAlgorithm', () => {
  it('places every node at finite coordinates', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'stress' },
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
        { id: 'c', width: 40, height: 30 },
        { id: 'd', width: 40, height: 30 },
      ],
      edges: [
        { id: 'ab', sources: ['a'], targets: ['b'] },
        { id: 'bc', sources: ['b'], targets: ['c'] },
        { id: 'cd', sources: ['c'], targets: ['d'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    for (const node of graph.children) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it('keeps adjacent nodes closer than nodes at graph distance 3', async () => {
    // Path: a — b — c — d. Graph distance(a, b) = 1, graph distance(a, d) = 3.
    // Stress majorization should make Euclidean(a, b) < Euclidean(a, d).
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'stress' },
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
        { id: 'd', width: 30, height: 30 },
      ],
      edges: [
        { id: 'ab', sources: ['a'], targets: ['b'] },
        { id: 'bc', sources: ['b'], targets: ['c'] },
        { id: 'cd', sources: ['c'], targets: ['d'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const d = findById(graph, 'd');
    expect(distance(a, b)).toBeLessThan(distance(a, d));
  });

  it('handles a disconnected graph without crashing', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'stress' },
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
        { id: 'd', width: 30, height: 30 },
      ],
      edges: [
        { id: 'ab', sources: ['a'], targets: ['b'] },
        { id: 'cd', sources: ['c'], targets: ['d'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    for (const node of graph.children) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });
});
