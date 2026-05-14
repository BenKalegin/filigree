/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Property-based tests for the default layered pipeline.
 *
 * Each property is checked over many randomly-generated graphs via
 * `fast-check`. Properties cover the strongest invariants the algorithm
 * should hold for *any* well-formed DAG, not the brittle pixel-coords of
 * specific examples.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkGraph, fromJson, type IJsonGraph } from '@filigree/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const NUM_RUNS = 80;
const MIN_NODES = 2;
const MAX_NODES = 12;
const NODE_WIDTH = 40;
const NODE_HEIGHT = 30;
const Y_SAME_LAYER_TOLERANCE = 1;

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

// Arbitrary DAG: N nodes labelled `n0..n{N-1}`. Edges only go from lower index
// to higher index, so the result is acyclic by construction.
const dagArbitrary = fc
  .integer({ min: MIN_NODES, max: MAX_NODES })
  .chain((nodeCount) =>
    fc
      .array(
        fc
          .tuple(
            fc.integer({ min: 0, max: nodeCount - 2 }),
            fc.integer({ min: 1, max: nodeCount - 1 }),
          )
          .filter(([s, t]) => s < t),
        { minLength: 1, maxLength: nodeCount * 2 },
      )
      .map((edges) => ({ nodeCount, edges })),
  );

const buildJsonDag = (spec: { nodeCount: number; edges: readonly (readonly number[])[] }): IJsonGraph => ({
  id: 'root',
  children: Array.from({ length: spec.nodeCount }, (_, i) => ({
    id: `n${String(i)}`,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  })),
  edges: spec.edges.map(([source, target], i) => ({
    id: `e${String(i)}`,
    sources: [`n${String(source)}`],
    targets: [`n${String(target)}`],
  })),
});

const layoutDag = async (spec: { nodeCount: number; edges: readonly (readonly number[])[] }): Promise<ElkGraph> => {
  const graph = fromJson(buildJsonDag(spec));
  await buildEngine().layout(graph);
  return graph;
};

describe('layered properties', () => {
  it('places every node at finite, non-negative coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(dagArbitrary, async (spec) => {
        const graph = await layoutDag(spec);
        for (const node of graph.children) {
          expect(Number.isFinite(node.x)).toBe(true);
          expect(Number.isFinite(node.y)).toBe(true);
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(0);
          expect(node.width).toBe(NODE_WIDTH);
          expect(node.height).toBe(NODE_HEIGHT);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('respects topological order: every edge source sits above its target', async () => {
    await fc.assert(
      fc.asyncProperty(dagArbitrary, async (spec) => {
        const graph = await layoutDag(spec);
        const byId = new Map(graph.children.map((n) => [n.id, n]));
        for (const edge of graph.containedEdges) {
          const [s] = edge.sources;
          const [t] = edge.targets;
          if (s === undefined || t === undefined) continue;
          const source = byId.get(s.id);
          const target = byId.get(t.id);
          if (source === undefined || target === undefined) continue;
          // source.y < target.y (default top-down direction).
          expect(source.y).toBeLessThan(target.y);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('produces non-overlapping nodes within each layer', async () => {
    await fc.assert(
      fc.asyncProperty(dagArbitrary, async (spec) => {
        const graph = await layoutDag(spec);
        // Group by approximate y.
        const layers = groupByLayer(graph.children);
        for (const layer of layers.values()) {
          const sorted = [...layer].sort((a, b) => a.x - b.x);
          for (let i = 1; i < sorted.length; i++) {
            const left = sorted[i - 1]!;
            const right = sorted[i]!;
            // right starts at or after left ends.
            expect(right.x).toBeGreaterThanOrEqual(left.x + left.width);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('routes every edge with axis-aligned (orthogonal) segments only', async () => {
    await fc.assert(
      fc.asyncProperty(dagArbitrary, async (spec) => {
        const graph = await layoutDag(spec);
        for (const edge of graph.containedEdges) {
          const points = edge.bendPoints;
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1]!;
            const b = points[i]!;
            const horizontal = a.y === b.y;
            const vertical = a.x === b.x;
            expect(horizontal || vertical).toBe(true);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

const groupByLayer = (nodes: readonly { x: number; y: number; width: number }[]) => {
  const layers = new Map<number, typeof nodes[number][]>();
  for (const node of nodes) {
    const key = Math.round(node.y / Y_SAME_LAYER_TOLERANCE);
    let bucket = layers.get(key);
    if (bucket === undefined) {
      bucket = [];
      layers.set(key, bucket);
    }
    bucket.push(node);
  }
  return layers;
};
