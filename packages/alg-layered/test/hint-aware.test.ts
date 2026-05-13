/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Tests for the hint-aware decorators around the layered pipeline.
 *
 * Strategy mirrors the rest of the suite: assert relational invariants
 * (same layer, left-of, layer-after), not pixel coordinates.
 */

import { describe, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@filigree/graph';
import { attachHints, orderBefore, sameLayer } from '@filigree/hints';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import {
  expectAllPositioned,
  expectLayerAfter,
  expectLeftOf,
  expectSameLayer,
} from './layout-assertions.js';

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

describe('HintAwareLayerer: SameLayer hint', () => {
  // a → b → c; d is parallel with no edges from b. With longest-path,
  // d lands on layer 0 (no incoming, no outgoing). SameLayer(d, b)
  // should push d down to b's layer.
  it('pushes both nodes onto max(layer(a), layer(b))', async () => {
    const graph = fromJson({
      id: 'root',
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

    attachHints(graph, [sameLayer('d', 'b')]);

    await buildEngine().layout(graph);

    expectAllPositioned(graph.children);
    expectSameLayer(findById(graph, 'd'), findById(graph, 'b'));
    expectLayerAfter(findById(graph, 'b'), findById(graph, 'a'));
    expectLayerAfter(findById(graph, 'c'), findById(graph, 'b'));
  });

  it('is a no-op when both nodes are already in the same layer', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'p', width: 30, height: 30 },
        { id: 'q', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['a'], targets: ['p'] },
        { id: 'e2', sources: ['b'], targets: ['q'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [sameLayer('a', 'b')]);

    await buildEngine().layout(graph);

    expectSameLayer(findById(graph, 'a'), findById(graph, 'b'));
    expectSameLayer(findById(graph, 'p'), findById(graph, 'q'));
  });

  it('ignores hints referencing unknown ids', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
      ],
      edges: [{ id: 'e1', sources: ['a'], targets: ['b'] }],
    } satisfies IJsonGraph);

    attachHints(graph, [sameLayer('a', 'ghost')]);

    await buildEngine().layout(graph);

    expectAllPositioned(graph.children);
    expectLayerAfter(findById(graph, 'b'), findById(graph, 'a'));
  });
});

describe('HintAwareCrossingMinimizer: OrderBefore hint', () => {
  // Two siblings on the same layer fed by a common parent. Barycenter
  // leaves them in input order [s1, s2]; OrderBefore(s2, s1) swaps them.
  it('swaps a same-layer pair to honor a left-right hint', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'parent', width: 30, height: 30 },
        { id: 's1', width: 30, height: 30 },
        { id: 's2', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['parent'], targets: ['s1'] },
        { id: 'e2', sources: ['parent'], targets: ['s2'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [orderBefore('s2', 's1')]);

    await buildEngine().layout(graph);

    expectSameLayer(findById(graph, 's1'), findById(graph, 's2'));
    expectLeftOf(findById(graph, 's2'), findById(graph, 's1'));
  });

  it('leaves order untouched when the hint already matches', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'parent', width: 30, height: 30 },
        { id: 's1', width: 30, height: 30 },
        { id: 's2', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['parent'], targets: ['s1'] },
        { id: 'e2', sources: ['parent'], targets: ['s2'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [orderBefore('s1', 's2')]);

    await buildEngine().layout(graph);

    expectLeftOf(findById(graph, 's1'), findById(graph, 's2'));
  });

  it('ignores OrderBefore when the two nodes end up on different layers', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['a'], targets: ['b'] },
        { id: 'e2', sources: ['b'], targets: ['c'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [orderBefore('c', 'a')]);

    await buildEngine().layout(graph);

    expectAllPositioned(graph.children);
    expectLayerAfter(findById(graph, 'b'), findById(graph, 'a'));
    expectLayerAfter(findById(graph, 'c'), findById(graph, 'b'));
  });
});

describe('HintAwareLayerer + HintAwareCrossingMinimizer combined', () => {
  // Build two unrelated branches; force them onto the same layer with
  // SameLayer, then dictate left-right order with OrderBefore. This
  // exercises both decorators in one pipeline pass.
  it('honors a SameLayer + OrderBefore pair on otherwise-disjoint nodes', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'root_a', width: 30, height: 30 },
        { id: 'leaf_a', width: 30, height: 30 },
        { id: 'root_b', width: 30, height: 30 },
        { id: 'leaf_b', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['root_a'], targets: ['leaf_a'] },
        { id: 'e2', sources: ['root_b'], targets: ['leaf_b'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [sameLayer('leaf_a', 'leaf_b'), orderBefore('leaf_b', 'leaf_a')]);

    await buildEngine().layout(graph);

    const leafA = findById(graph, 'leaf_a');
    const leafB = findById(graph, 'leaf_b');
    expectSameLayer(leafA, leafB);
    expectLeftOf(leafB, leafA);
  });
});
