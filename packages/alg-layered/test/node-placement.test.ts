import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@filigree/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

const centerX = (node: ElkNode): number => node.x + node.width / 2;

describe('balanced node placement', () => {
  it('keeps a vertical chain aligned (every node shares the same center x)', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
        { id: 'c', width: 40, height: 30 },
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
    expect(centerX(a)).toBe(centerX(b));
    expect(centerX(b)).toBe(centerX(c));
  });

  it('centers a merge node at the average of its predecessor centers', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'root_node', width: 40, height: 30 },
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
        { id: 'merge', width: 40, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['root_node'], targets: ['a'] },
        { id: 'e2', sources: ['root_node'], targets: ['b'] },
        { id: 'e3', sources: ['a'], targets: ['merge'] },
        { id: 'e4', sources: ['b'], targets: ['merge'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const merge = findById(graph, 'merge');
    expect(centerX(merge)).toBe((centerX(a) + centerX(b)) / 2);
  });

  it('never overlaps two nodes in the same layer (no x-range intersection)', async () => {
    // Two layers, three nodes each — wider nodes should not overlap.
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a1', width: 80, height: 30 },
        { id: 'a2', width: 120, height: 30 },
        { id: 'a3', width: 50, height: 30 },
        { id: 'b1', width: 60, height: 30 },
        { id: 'b2', width: 60, height: 30 },
        { id: 'b3', width: 60, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['a1'], targets: ['b1'] },
        { id: 'e2', sources: ['a2'], targets: ['b2'] },
        { id: 'e3', sources: ['a3'], targets: ['b3'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    // Group nodes by their y-coordinate (their layer).
    const byLayer = new Map<number, ElkNode[]>();
    for (const n of graph.children) {
      const list = byLayer.get(n.y) ?? [];
      list.push(n);
      byLayer.set(n.y, list);
    }
    for (const layer of byLayer.values()) {
      const sorted = [...layer].sort((p, q) => p.x - q.x);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]!;
        const curr = sorted[i]!;
        expect(curr.x).toBeGreaterThanOrEqual(prev.x + prev.width);
      }
    }
  });
});
