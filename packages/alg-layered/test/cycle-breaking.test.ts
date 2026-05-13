import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@elk/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@elk/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { expectAllPositioned, expectLayerAfter, expectSameLayer } from './layout-assertions.js';

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

describe('greedy cycle breaker', () => {
  // a → b → c → a   (one back edge)
  // After breaking, the layered DAG is effectively a → b → c (back edge flipped to a → c)
  // longest-path then places: a at layer 0, b and c at layer 1 (or 1 and 2 depending on
  // which edge ends up as the back edge — order is implementation-defined but stable).
  it('lays out a 3-cycle without crashing', async () => {
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
        { id: 'e3', sources: ['c'], targets: ['a'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expectAllPositioned(graph.children);
  });

  // a → a self-loop (plus a → b so the graph isn't trivially empty).
  // The self-loop is dropped; a → b is a normal edge.
  it('handles self-loops by dropping them', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
      ],
      edges: [
        { id: 'self', sources: ['a'], targets: ['a'] },
        { id: 'forward', sources: ['a'], targets: ['b'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expectLayerAfter(findById(graph, 'b'), findById(graph, 'a'));
  });

  // Tail → cycle: t → a → b → a (back edge), no edges out of b.
  // After cycle breaking the structure becomes a chain; t must remain at layer 0.
  it('keeps the tail before the cycle', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 't', width: 30, height: 30 },
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e_ta', sources: ['t'], targets: ['a'] },
        { id: 'e_ab', sources: ['a'], targets: ['b'] },
        { id: 'e_ba', sources: ['b'], targets: ['a'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expectLayerAfter(findById(graph, 'a'), findById(graph, 't'));
    expectAllPositioned(graph.children);
  });

  it('does nothing to an already-acyclic graph', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'x', width: 30, height: 30 },
        { id: 'y', width: 30, height: 30 },
        { id: 'z', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['x'], targets: ['y'] },
        { id: 'e2', sources: ['y'], targets: ['z'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expectLayerAfter(findById(graph, 'y'), findById(graph, 'x'));
    expectLayerAfter(findById(graph, 'z'), findById(graph, 'y'));
    // No same-layer collisions.
    expect(findById(graph, 'x').y).not.toBe(findById(graph, 'z').y);
    expectSameLayer(findById(graph, 'x'), findById(graph, 'x')); // sanity self-check
  });
});
