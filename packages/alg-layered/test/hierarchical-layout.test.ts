import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@elk/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@elk/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { expectAllPositioned, expectLayerAfter } from './layout-assertions.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (node: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = node.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

describe('hierarchical layout (compound nodes)', () => {
  // Root contains a compound 'group' (2 inner nodes, 1 inner edge) and a sibling.
  // An outer edge connects the group to the sibling.
  //
  //   root
  //   ├─ group ──→ sibling
  //   │   └─ inner-a ──→ inner-b
  //
  // Expectations:
  //   1. Inner nodes have inner-b laid out after inner-a (their own sub-layout).
  //   2. The group's size is no longer 0×0 — it grew to contain its children + padding.
  //   3. At the outer level, sibling is laid out after group.
  //   4. Every node has finite coordinates.
  it('lays out a compound graph bottom-up and sizes the compound from its children', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        {
          id: 'group',
          children: [
            { id: 'inner-a', width: 30, height: 30 },
            { id: 'inner-b', width: 30, height: 30 },
          ],
          edges: [{ id: 'ie', sources: ['inner-a'], targets: ['inner-b'] }],
        },
        { id: 'sibling', width: 30, height: 30 },
      ],
      edges: [{ id: 'oe', sources: ['group'], targets: ['sibling'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    expectAllPositioned(graph.children);

    // Inner layout: inner-b is below inner-a within the group.
    const group = findById(graph, 'group');
    const innerA = findById(group, 'inner-a');
    const innerB = findById(group, 'inner-b');
    expectLayerAfter(innerB, innerA);

    // The compound grew from default 0×0 to fit its children.
    expect(group.width).toBeGreaterThan(0);
    expect(group.height).toBeGreaterThan(0);

    // Outer layout: sibling is below group.
    const sibling = findById(graph, 'sibling');
    expectLayerAfter(sibling, group);
  });

  it('leaves leaf nodes untouched by the recursion', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'leaf-1', width: 30, height: 30 },
        { id: 'leaf-2', width: 30, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['leaf-1'], targets: ['leaf-2'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const leaf1 = findById(graph, 'leaf-1');
    const leaf2 = findById(graph, 'leaf-2');
    // Sizes were set in input; should not change for leaves.
    expect(leaf1.width).toBe(30);
    expect(leaf2.height).toBe(30);
    expectLayerAfter(leaf2, leaf1);
  });
});
