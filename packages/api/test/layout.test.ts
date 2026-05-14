/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';

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
