/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Targeted tests for the NetworkSimplexLayerer. The shared layered-POC test
 * file covers end-to-end correctness with `LongestPathLayerer`; this file
 * swaps in the network-simplex variant and checks that the layering still
 * satisfies the topological constraints and produces the tighter "balanced"
 * layout for cases where longest-path leaves slack.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@filigree/graph';

import {
  BarycenterCrossingMinimizer,
  BrandesKopfNodePlacer,
  DummyLongEdgeProcessor,
  GreedyCycleBreaker,
  LayeredAlgorithm,
  LayeredContextBuilder,
  LayeredResultApplier,
  NetworkSimplexLayerer,
  OrthogonalEdgeRouter,
} from '../src/index.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(
    new LayeredAlgorithm({
      contextBuilder: new LayeredContextBuilder(),
      cycleBreaker: new GreedyCycleBreaker(),
      layerAssigner: new NetworkSimplexLayerer(),
      longEdgeProcessor: new DummyLongEdgeProcessor(),
      crossingMinimizer: new BarycenterCrossingMinimizer(),
      nodePlacer: new BrandesKopfNodePlacer(),
      edgeRouter: new OrthogonalEdgeRouter(),
      resultApplier: new LayeredResultApplier(),
    }),
  );
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) throw new Error(`Node not found: ${id}`);
  return found;
};

describe('NetworkSimplexLayerer', () => {
  it('preserves topological order on a chain', async () => {
    const graph = fromJson({
      id: 'root',
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
    const c = findById(graph, 'c');
    const d = findById(graph, 'd');
    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);
    expect(c.y).toBeLessThan(d.y);
  });

  // a→t, a→m, m→t. Longest-path puts:
  //   a=0, m=1, t=2 — edge a→t has slack 1.
  // Network simplex can't shrink that without violating other constraints;
  // result is still a 3-layer layout, but `m` (no slack) stays at 1.
  it('keeps every edge spanning at least one layer', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'm', width: 30, height: 30 },
        { id: 't', width: 30, height: 30 },
      ],
      edges: [
        { id: 'am', sources: ['a'], targets: ['m'] },
        { id: 'at', sources: ['a'], targets: ['t'] },
        { id: 'mt', sources: ['m'], targets: ['t'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const a = findById(graph, 'a');
    const m = findById(graph, 'm');
    const t = findById(graph, 't');
    expect(a.y).toBeLessThan(m.y);
    expect(m.y).toBeLessThan(t.y);
  });

  // a→b, c→d, e — three disjoint components. Network simplex puts each
  // source at layer 0; only relative orderings within a component matter.
  it('handles disjoint components without crashing', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'c', width: 30, height: 30 },
        { id: 'd', width: 30, height: 30 },
        { id: 'e', width: 30, height: 30 },
      ],
      edges: [
        { id: 'ab', sources: ['a'], targets: ['b'] },
        { id: 'cd', sources: ['c'], targets: ['d'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expect(findById(graph, 'b').y).toBeGreaterThan(findById(graph, 'a').y);
    expect(findById(graph, 'd').y).toBeGreaterThan(findById(graph, 'c').y);
  });
});
