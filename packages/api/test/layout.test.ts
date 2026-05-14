/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';
import { fromJson } from '@filigree/graph';
import { attachHints, orderBefore } from '@filigree/hints';

import { layout } from '../src/layout.js';

describe('layout (single-call facade)', () => {
  it('lays out a 2-node JSON graph with the default algorithm (layered)', async () => {
    const graph = await layout({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
    });

    const a = graph.children.find((n) => n.id === 'a');
    const b = graph.children.find((n) => n.id === 'b');
    expect(Number.isFinite(a?.x) && Number.isFinite(a?.y)).toBe(true);
    expect(Number.isFinite(b?.x) && Number.isFinite(b?.y)).toBe(true);
    // Layered, default direction: source above target.
    expect(a?.y).toBeLessThan(b?.y ?? Infinity);
  });

  it('accepts a prebuilt ElkGraph so hints can be attached before layout', async () => {
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
    });
    attachHints(graph, [orderBefore('s2', 's1')]);
    await layout(graph);
    const s1 = graph.children.find((n) => n.id === 's1');
    const s2 = graph.children.find((n) => n.id === 's2');
    // OrderBefore(s2, s1) ⇒ s2 sits left of s1.
    expect((s2?.x ?? 0) < (s1?.x ?? 0)).toBe(true);
  });

  it('parses filigreeHints from JSON and attaches them before layout', async () => {
    const graph = await layout({
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
      filigreeHints: [{ kind: 'OrderBefore', before: 's2', after: 's1' }],
    });
    const s1 = graph.children.find((n) => n.id === 's1');
    const s2 = graph.children.find((n) => n.id === 's2');
    expect((s2?.x ?? 0) < (s1?.x ?? 0)).toBe(true);
  });

  it('drops malformed JSON hints silently', async () => {
    // Malformed: missing `before`/`after`. Should not throw; layout proceeds.
    const graph = await layout({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
      filigreeHints: [{ kind: 'OrderBefore' }, { kind: 'NotARealHint', node: 'a' }],
    });
    expect(graph.children.length).toBe(2);
  });

  it('routes through the force algorithm when requested', async () => {
    const graph = await layout(
      {
        id: 'root',
        children: [
          { id: 'a', width: 30, height: 30 },
          { id: 'b', width: 30, height: 30 },
        ],
        edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
      },
      { algorithm: 'force' },
    );
    const a = graph.children.find((n) => n.id === 'a');
    const b = graph.children.find((n) => n.id === 'b');
    expect(Number.isFinite(a?.x)).toBe(true);
    expect(Number.isFinite(b?.x)).toBe(true);
  });
});
