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

import { createDefaultRectPackingAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultRectPackingAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) throw new Error(`Node not found: ${id}`);
  return found;
};

describe('RectPackingAlgorithm', () => {
  it('places every node at a finite, non-negative coordinate', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'rectpacking' },
      children: [
        { id: 'a', width: 60, height: 40 },
        { id: 'b', width: 80, height: 30 },
        { id: 'c', width: 50, height: 50 },
        { id: 'd', width: 70, height: 30 },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    for (const node of graph.children) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces non-overlapping rectangles', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'rectpacking' },
      children: Array.from({ length: 8 }, (_, i) => ({
        id: `n${String(i)}`,
        width: 40 + (i % 3) * 10,
        height: 30 + (i % 2) * 20,
      })),
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const rects = graph.children.map((n) => ({
      id: n.id,
      x1: n.x,
      y1: n.y,
      x2: n.x + n.width,
      y2: n.y + n.height,
    }));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
        expect(overlap, `${a.id} and ${b.id} overlap`).toBe(false);
      }
    }
  });

  it('places the largest-area node at the top-left', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'rectpacking' },
      children: [
        { id: 'small', width: 30, height: 30 },
        { id: 'large', width: 100, height: 100 },
        { id: 'medium', width: 60, height: 60 },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    // After bottom-up bbox-fit shifts everything by `padding`, top-left is
    // the smallest (x + y) among nodes.
    const large = findById(graph, 'large');
    for (const other of graph.children) {
      if (other.id === large.id) continue;
      expect(large.x + large.y).toBeLessThanOrEqual(other.x + other.y);
    }
  });
});
