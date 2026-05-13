import { describe, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@filigree/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { expectLeftOf, expectSameLayer } from './layout-assertions.js';

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

describe('barycenter crossing minimization', () => {
  // Two layers; declared order [n1, n2] then [m1, m2]. Edges cross:
  //   n1 → m2  and  n2 → m1.
  // With barycenter:
  //   m1's only predecessor is n2 (indexInLayer 1) → barycenter 1.
  //   m2's only predecessor is n1 (indexInLayer 0) → barycenter 0.
  // Sort ascending by barycenter ⇒ second layer becomes [m2, m1]: no more crossing.
  it('swaps a second-layer pair to eliminate a single crossing', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'n1', width: 30, height: 30 },
        { id: 'n2', width: 30, height: 30 },
        { id: 'm1', width: 30, height: 30 },
        { id: 'm2', width: 30, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['n1'], targets: ['m2'] },
        { id: 'e2', sources: ['n2'], targets: ['m1'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const byId = (id: string): ElkNode => findById(graph, id);

    // First-layer order is preserved (no predecessors → keep input order).
    expectLeftOf(byId('n1'), byId('n2'));
    expectSameLayer(byId('n1'), byId('n2'));

    // Second-layer order swapped to remove the crossing.
    expectLeftOf(byId('m2'), byId('m1'));
    expectSameLayer(byId('m1'), byId('m2'));
  });

  it('preserves order when there is no crossing to fix', async () => {
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

    await buildEngine().layout(graph);

    const byId = (id: string): ElkNode => findById(graph, id);
    expectLeftOf(byId('a'), byId('b'));
    expectLeftOf(byId('p'), byId('q'));
  });
});
