/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Property-based tests for the post-layout hint applicator.
 *
 * Verifies algebraic invariants of the hints that are easy to express:
 *
 *   - `PinPosition` is idempotent (applying twice has the same effect as
 *     once).
 *   - `Focus` translates *every* node by the same delta (relative
 *     geometry preserved).
 *   - `Focus` is involutive when composed with the inverse anchor: focus
 *     to (cx, cy) followed by focus back to the node's original center
 *     restores the original layout exactly.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { type ElkNode, fromJson } from '@filigree/graph';

import { applyHints, focus, pinPosition } from '../src/index.js';

const NUM_RUNS = 60;
const MIN_NODES = 2;
const MAX_NODES = 8;
const COORD_RANGE = 500;

const positionedNode = (id: number) =>
  fc
    .tuple(
      fc.integer({ min: 0, max: COORD_RANGE }),
      fc.integer({ min: 0, max: COORD_RANGE }),
      fc.integer({ min: 10, max: 60 }),
      fc.integer({ min: 10, max: 60 }),
    )
    .map(([x, y, width, height]) => ({ id: `n${String(id)}`, x, y, width, height }));

const positionedGraph = fc
  .integer({ min: MIN_NODES, max: MAX_NODES })
  .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => positionedNode(i))))
  .map((children) => ({ id: 'root', children: [...children] }));

const findById = (children: readonly ElkNode[], id: string): ElkNode | undefined =>
  children.find((n) => n.id === id);

describe('hint properties', () => {
  it('PinPosition is idempotent', () => {
    fc.assert(
      fc.property(positionedGraph, fc.integer(), fc.integer(), (json, x, y) => {
        const graph = fromJson(json);
        const id = graph.children[0]!.id;
        applyHints(graph, [pinPosition(id, x, y)]);
        const firstPos = { x: graph.children[0]!.x, y: graph.children[0]!.y };
        applyHints(graph, [pinPosition(id, x, y)]);
        expect(graph.children[0]!.x).toBe(firstPos.x);
        expect(graph.children[0]!.y).toBe(firstPos.y);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('Focus translates every node by the same delta', () => {
    fc.assert(
      fc.property(positionedGraph, fc.integer({ min: -100, max: 100 }), (json, target) => {
        const graph = fromJson(json);
        const focusId = graph.children[0]!.id;
        const focusNode = findById(graph.children, focusId)!;
        const expectedDx = target - (focusNode.x + focusNode.width / 2);
        const expectedDy = target - (focusNode.y + focusNode.height / 2);
        // Capture original positions.
        const original = new Map(graph.children.map((n) => [n.id, { x: n.x, y: n.y }]));
        applyHints(graph, [focus(focusId, target, target)]);
        for (const node of graph.children) {
          const orig = original.get(node.id)!;
          expect(node.x - orig.x).toBe(expectedDx);
          expect(node.y - orig.y).toBe(expectedDy);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('Focus to a point then back to original center restores the layout', () => {
    fc.assert(
      fc.property(positionedGraph, fc.integer({ min: -200, max: 200 }), (json, anchor) => {
        const graph = fromJson(json);
        const focusId = graph.children[0]!.id;
        const focusNode = findById(graph.children, focusId)!;
        const originalCenterX = focusNode.x + focusNode.width / 2;
        const originalCenterY = focusNode.y + focusNode.height / 2;
        const before = new Map(graph.children.map((n) => [n.id, { x: n.x, y: n.y }]));
        applyHints(graph, [focus(focusId, anchor, anchor)]);
        applyHints(graph, [focus(focusId, originalCenterX, originalCenterY)]);
        for (const node of graph.children) {
          const orig = before.get(node.id)!;
          expect(node.x).toBe(orig.x);
          expect(node.y).toBe(orig.y);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
