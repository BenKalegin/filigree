/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * `elk.edgeRouting` lets hosts skip filigree's orthogonal router when they
 * have their own routing pass downstream. The option is graph-level and
 * read at the start of the layered run.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@benkalegin/filigree-core';
import { fromJson, type IJsonGraph } from '@benkalegin/filigree-graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

// Long-edge graph: a → b → c → d, with one direct a→d that spans 3 layers.
// The long edge forces the router to thread through dummies, so it would
// normally emit at least one bend point. That gives us a positive signal
// to assert against.
const longEdgeGraph = (edgeRouting?: string): IJsonGraph => ({
  id: 'root',
  ...(edgeRouting === undefined ? {} : { layoutOptions: { 'elk.edgeRouting': edgeRouting } }),
  children: [
    { id: 'a', width: 40, height: 20 },
    { id: 'b', width: 40, height: 20 },
    { id: 'c', width: 40, height: 20 },
    { id: 'd', width: 40, height: 20 },
  ],
  edges: [
    { id: 'e1', sources: ['a'], targets: ['b'] },
    { id: 'e2', sources: ['b'], targets: ['c'] },
    { id: 'e3', sources: ['c'], targets: ['d'] },
    { id: 'long', sources: ['a'], targets: ['d'] },
  ],
});

const findEdge = (graph: { containedEdges: readonly { id: string; bendPoints: readonly unknown[] }[] }, id: string) => {
  const found = graph.containedEdges.find((e) => e.id === id);
  if (found === undefined) throw new Error(`Edge ${id} not found`);
  return found;
};

describe('elk.edgeRouting', () => {
  it('defaults to ORTHOGONAL — long edges get bend points through dummies', async () => {
    const graph = fromJson(longEdgeGraph());
    await buildEngine().layout(graph);
    const longEdge = findEdge(graph, 'long');
    expect(longEdge.bendPoints.length).toBeGreaterThan(0);
  });

  it('OFF skips the router — every edge has empty bend points', async () => {
    const graph = fromJson(longEdgeGraph('OFF'));
    await buildEngine().layout(graph);
    for (const edge of graph.containedEdges) {
      expect(edge.bendPoints).toEqual([]);
      expect(edge.routeSegments).toEqual([]);
    }
  });

  it('POLYLINE is currently aliased to OFF — empty bend points', async () => {
    const graph = fromJson(longEdgeGraph('POLYLINE'));
    await buildEngine().layout(graph);
    for (const edge of graph.containedEdges) {
      expect(edge.bendPoints).toEqual([]);
    }
  });

  it('ORTHOGONAL explicitly matches the default', async () => {
    const graph = fromJson(longEdgeGraph('ORTHOGONAL'));
    await buildEngine().layout(graph);
    const longEdge = findEdge(graph, 'long');
    expect(longEdge.bendPoints.length).toBeGreaterThan(0);
  });

  it('lowercase aliases (`off`) work', async () => {
    const graph = fromJson(longEdgeGraph('off'));
    await buildEngine().layout(graph);
    const longEdge = findEdge(graph, 'long');
    expect(longEdge.bendPoints).toEqual([]);
  });

  it('unknown values fall back to ORTHOGONAL', async () => {
    const graph = fromJson(longEdgeGraph('BEZIER'));
    await buildEngine().layout(graph);
    const longEdge = findEdge(graph, 'long');
    expect(longEdge.bendPoints.length).toBeGreaterThan(0);
  });

  it('skipping the router still lays out node positions', async () => {
    const graph = fromJson(longEdgeGraph('OFF'));
    await buildEngine().layout(graph);
    for (const child of graph.children) {
      expect(Number.isFinite(child.x)).toBe(true);
      expect(Number.isFinite(child.y)).toBe(true);
    }
  });
});
