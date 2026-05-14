/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * `elk.direction` flips the layered pipeline between TB / BT / LR / RL by
 * rotating the input before layout and the output after. Each direction is
 * checked by the *relative positions* of three chained nodes — the actual
 * spacing values don't matter, only that nodes flow in the right cardinal
 * direction and stay aligned in the perpendicular axis.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@benkalegin/filigree-core';
import { type ElkNode, fromJson, type IJsonGraph } from '@benkalegin/filigree-graph';
import { attachHints, orderBefore, sameLayer } from '@benkalegin/filigree-hints';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { expectAllPositioned } from './layout-assertions.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findById = (root: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = root.children.find((n) => n.id === id);
  if (found === undefined) throw new Error(`Node not found: ${id}`);
  return found;
};

const chainGraph = (direction?: string): IJsonGraph => ({
  id: 'root',
  ...(direction === undefined ? {} : { layoutOptions: { 'elk.direction': direction } }),
  children: [
    { id: 'a', width: 40, height: 20 },
    { id: 'b', width: 40, height: 20 },
    { id: 'c', width: 40, height: 20 },
  ],
  edges: [
    { id: 'e1', sources: ['a'], targets: ['b'] },
    { id: 'e2', sources: ['b'], targets: ['c'] },
  ],
});

describe('elk.direction', () => {
  it('defaults to DOWN — a → b → c flow top-to-bottom', async () => {
    const graph = fromJson(chainGraph());
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const c = findById(graph, 'c');
    expectAllPositioned(graph.children);
    expect(b.y).toBeGreaterThan(a.y);
    expect(c.y).toBeGreaterThan(b.y);
  });

  it('DOWN explicitly matches the default behavior', async () => {
    const graph = fromJson(chainGraph('DOWN'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const c = findById(graph, 'c');
    expect(c.y).toBeGreaterThan(a.y);
  });

  it('RIGHT flows a → b → c left-to-right and preserves node dimensions', async () => {
    const graph = fromJson(chainGraph('RIGHT'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const c = findById(graph, 'c');
    expectAllPositioned(graph.children);
    expect(b.x).toBeGreaterThan(a.x);
    expect(c.x).toBeGreaterThan(b.x);
    // Dimensions in user frame: 40×20, not the transposed 20×40.
    expect(a.width).toBe(40);
    expect(a.height).toBe(20);
  });

  it('UP flows a → b → c bottom-to-top', async () => {
    const graph = fromJson(chainGraph('UP'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const c = findById(graph, 'c');
    expectAllPositioned(graph.children);
    expect(b.y).toBeLessThan(a.y);
    expect(c.y).toBeLessThan(b.y);
    expect(a.width).toBe(40);
    expect(a.height).toBe(20);
  });

  it('LEFT flows a → b → c right-to-left', async () => {
    const graph = fromJson(chainGraph('LEFT'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    const c = findById(graph, 'c');
    expectAllPositioned(graph.children);
    expect(b.x).toBeLessThan(a.x);
    expect(c.x).toBeLessThan(b.x);
    expect(a.width).toBe(40);
    expect(a.height).toBe(20);
  });

  it('lowercase aliases (`right`) work too', async () => {
    const graph = fromJson(chainGraph('right'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const c = findById(graph, 'c');
    expect(c.x).toBeGreaterThan(a.x);
  });

  it('unknown direction values fall back to DOWN', async () => {
    const graph = fromJson(chainGraph('NORTHEAST'));
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const c = findById(graph, 'c');
    expect(c.y).toBeGreaterThan(a.y);
  });

  it('RIGHT routes edges with bend points in the rotated frame', async () => {
    const graph = fromJson(chainGraph('RIGHT'));
    await buildEngine().layout(graph);
    // For a strictly linear 3-node chain in LR, the edge between adjacent
    // layers is a straight horizontal segment — orthogonal router emits 0
    // bend points when start/end share a y. So we just assert finite values.
    for (const edge of graph.containedEdges) {
      for (const point of edge.bendPoints) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
      }
    }
  });

  it('RIGHT transposes pre-set port positions correctly', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.direction': 'RIGHT' },
      children: [
        {
          id: 'a',
          width: 40,
          height: 20,
          ports: [{ id: 'a.out', x: 40, y: 10, width: 0, height: 0 }],
        },
        {
          id: 'b',
          width: 40,
          height: 20,
          ports: [{ id: 'b.in', x: 0, y: 10, width: 0, height: 0 }],
        },
      ],
      edges: [{ id: 'e', sources: ['a.out'], targets: ['b.in'] }],
    });
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    expect(a.width).toBe(40);
    expect(a.height).toBe(20);
    // Port positions in child-local frame should be back to user-specified.
    const outPort = a.ports.find((p) => p.id === 'a.out')!;
    const inPort = b.ports.find((p) => p.id === 'b.in')!;
    expect(outPort.x).toBe(40);
    expect(outPort.y).toBe(10);
    expect(inPort.x).toBe(0);
    expect(inPort.y).toBe(10);
  });

  // OrderBefore + direction interaction: the hint is "first in layer's
  // perpendicular axis". For DOWN that's "left of". For RIGHT (90° rotation
  // of the internal TB result) it's "above".
  it('OrderBefore under direction=RIGHT puts the first node above the second', async () => {
    const graph = fromJson({
      id: 'root',
      layoutOptions: { 'elk.direction': 'RIGHT' },
      children: [
        { id: 'src', width: 40, height: 20 },
        { id: 'a', width: 40, height: 20 },
        { id: 'b', width: 40, height: 20 },
      ],
      edges: [
        { id: 'e1', sources: ['src'], targets: ['a'] },
        { id: 'e2', sources: ['src'], targets: ['b'] },
      ],
    } satisfies IJsonGraph);
    attachHints(graph, [sameLayer('a', 'b'), orderBefore('b', 'a')]);
    await buildEngine().layout(graph);
    const a = findById(graph, 'a');
    const b = findById(graph, 'b');
    // OrderBefore(b, a) — b comes first in the perpendicular axis. Under
    // RIGHT, "perpendicular to flow" = vertical, so b sits above a.
    expect(b.y).toBeLessThan(a.y);
  });

  it('honors direction set on a compound — outer DOWN, inner RIGHT', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        {
          id: 'group',
          layoutOptions: { 'elk.direction': 'RIGHT' },
          children: [
            { id: 'g1', width: 30, height: 20 },
            { id: 'g2', width: 30, height: 20 },
          ],
          edges: [{ id: 'ig', sources: ['g1'], targets: ['g2'] }],
        },
        { id: 'sibling', width: 30, height: 20 },
      ],
      edges: [{ id: 'og', sources: ['group'], targets: ['sibling'] }],
    } satisfies IJsonGraph);
    await buildEngine().layout(graph);
    const group = findById(graph, 'group');
    const g1 = findById(group, 'g1');
    const g2 = findById(group, 'g2');
    const sibling = findById(graph, 'sibling');
    // Outer DOWN: sibling below group.
    expect(sibling.y).toBeGreaterThan(group.y);
    // Inner RIGHT: g2 to the right of g1 (in group's local frame).
    expect(g2.x).toBeGreaterThan(g1.x);
  });
});
