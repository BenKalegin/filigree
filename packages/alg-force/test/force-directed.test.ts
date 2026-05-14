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

import { createDefaultForceAlgorithm } from '../src/composition.js';
import { FORCE_ALGORITHM_ID } from '../src/force-directed-algorithm.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultForceAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

const centerDistance = (a: ElkNode, b: ElkNode): number => {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
};

const baseGraph: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': FORCE_ALGORITHM_ID },
  children: [],
  edges: [],
};

describe('force-directed algorithm', () => {
  it('registers under the id "force" and is selected via elk.algorithm', async () => {
    const graph = fromJson({
      ...baseGraph,
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
    expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
  });

  it('keeps connected nodes closer than disconnected ones', async () => {
    // Three connected nodes a→b→c plus an isolated d. d should drift away;
    // a, b, c should converge to roughly equilateral spacing.
    const graph = fromJson({
      ...baseGraph,
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
        { id: 'd', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['a'], targets: ['b'] },
        { id: 'e2', sources: ['b'], targets: ['c'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const c = findById(graph, 'c');
    const d = findById(graph, 'd');

    // a–b connected; should be closer than a–d (not directly connected, only
    // pushed apart by repulsion).
    expect(centerDistance(a, b)).toBeLessThan(centerDistance(a, d));
    expect(centerDistance(b, c)).toBeLessThan(centerDistance(b, d));
  });

  it('is deterministic — same input produces the same output', async () => {
    const json: IJsonGraph = {
      ...baseGraph,
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['a'], targets: ['b'] },
        { id: 'e2', sources: ['b'], targets: ['c'] },
      ],
    };

    const g1 = fromJson(json);
    const g2 = fromJson(json);
    await buildEngine().layout(g1);
    await buildEngine().layout(g2);

    for (const id of ['a', 'b', 'c']) {
      const n1 = findById(g1, id);
      const n2 = findById(g2, id);
      expect(n1.x).toBe(n2.x);
      expect(n1.y).toBe(n2.y);
    }
  });

  it('handles an empty graph without crashing', async () => {
    const graph = fromJson({ ...baseGraph } satisfies IJsonGraph);
    await expect(buildEngine().layout(graph)).resolves.toBeDefined();
  });
});
