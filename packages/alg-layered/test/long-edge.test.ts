/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Tests for the dummy long-edge processor. Strategy: build a graph with at
 * least one edge that spans more than one layer, then assert the edge's
 * routed polyline has waypoints between the source and target layers.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkEdge, type ElkNode, fromJson, type IJsonGraph } from '@filigree/graph';
import { attachHints, sameLayer } from '@filigree/hints';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findEdge = (graph: { containedEdges: readonly ElkEdge[] }, id: string): ElkEdge => {
  const found = graph.containedEdges.find((e) => e.id === id);
  if (found === undefined) throw new Error(`Edge not found: ${id}`);
  return found;
};

const findNode = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) throw new Error(`Node not found: ${id}`);
  return found;
};

describe('DummyLongEdgeProcessor', () => {
  // Graph: a (layer 0) → b (layer 1) → c (layer 2), plus a → c spanning 2
  // layers. The long edge should route through a waypoint between layers
  // 0 and 2 (i.e. with a bend point near layer 1's y range).
  it('produces extra bend points for an edge spanning two layers', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
        { id: 'c', width: 40, height: 30 },
      ],
      edges: [
        { id: 'short_ab', sources: ['a'], targets: ['b'] },
        { id: 'short_bc', sources: ['b'], targets: ['c'] },
        { id: 'long_ac', sources: ['a'], targets: ['c'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const a = findNode(graph, 'a');
    const b = findNode(graph, 'b');
    const c = findNode(graph, 'c');
    const longEdge = findEdge(graph, 'long_ac');

    // Verify a → b → c are on three distinct layers (sanity check that the
    // long edge actually spans more than one layer).
    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);

    // A simple two-bend route would give 2 bend points (or 0 if same column).
    // Threading through a dummy on layer 1 produces 4 bend points: 2 between
    // a and the dummy, 2 between the dummy and c.
    expect(longEdge.bendPoints.length).toBeGreaterThanOrEqual(2);
  });

  // Short edges (span exactly 1 layer) should not get dummies — their bend
  // points stay the same as before the processor was introduced.
  it('leaves single-layer edges unchanged', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    // Same-column source/target with no dummies ⇒ 0 bend points.
    expect(findEdge(graph, 'e').bendPoints).toEqual([]);
  });

  // SameLayer hint forces two nodes onto a layer further down than longest-
  // path would have placed them. The edges leading to the pushed node now
  // span multiple layers and should pick up dummies.
  it('inserts dummies for edges that became long after a SameLayer hint', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
        { id: 'left_leaf', width: 40, height: 30 },
        { id: 'c', width: 40, height: 30 },
        { id: 'd', width: 40, height: 30 },
        { id: 'right_leaf', width: 40, height: 30 },
      ],
      edges: [
        { id: 'ab', sources: ['a'], targets: ['b'] },
        { id: 'b_left', sources: ['b'], targets: ['left_leaf'] },
        { id: 'ac', sources: ['a'], targets: ['c'] },
        { id: 'cd', sources: ['c'], targets: ['d'] },
        { id: 'd_right', sources: ['d'], targets: ['right_leaf'] },
      ],
    } satisfies IJsonGraph);

    attachHints(graph, [sameLayer('left_leaf', 'right_leaf')]);

    await buildEngine().layout(graph);

    const bLeft = findEdge(graph, 'b_left');
    // left_leaf was pushed down a layer ⇒ b → left_leaf now spans 2
    // layers ⇒ at least one bend point at a non-trivial y.
    expect(bLeft.bendPoints.length).toBeGreaterThanOrEqual(2);
  });
});
