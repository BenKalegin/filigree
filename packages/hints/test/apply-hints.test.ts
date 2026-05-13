/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';
import { fromJson, type IJsonGraph } from '@filigree/graph';

import { applyHints, pinPosition } from '../src/index.js';

const GRAPH: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'a', x: 10, y: 10, width: 30, height: 30 },
    { id: 'b', x: 60, y: 10, width: 30, height: 30 },
  ],
};

describe('applyHints', () => {
  it('moves a pinned node to the requested coordinates', () => {
    const graph = fromJson(GRAPH);
    applyHints(graph, [pinPosition('a', 500, 200)]);
    const a = graph.children.find((n) => n.id === 'a');
    expect(a?.x).toBe(500);
    expect(a?.y).toBe(200);
  });

  it('leaves un-hinted nodes untouched', () => {
    const graph = fromJson(GRAPH);
    applyHints(graph, [pinPosition('a', 500, 200)]);
    const b = graph.children.find((n) => n.id === 'b');
    expect(b?.x).toBe(60);
    expect(b?.y).toBe(10);
  });

  it('silently ignores hints that reference an unknown node id', () => {
    const graph = fromJson(GRAPH);
    applyHints(graph, [pinPosition('missing', 1, 1)]);
    const a = graph.children.find((n) => n.id === 'a');
    expect(a?.x).toBe(10); // unchanged
  });

  it('does nothing when the hint list is empty', () => {
    const graph = fromJson(GRAPH);
    applyHints(graph, []);
    const a = graph.children.find((n) => n.id === 'a');
    expect(a?.x).toBe(10);
  });

  it('finds nodes inside compound children', () => {
    const graph = fromJson({
      id: 'root',
      children: [
        {
          id: 'compound',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          children: [{ id: 'inner', x: 5, y: 5, width: 20, height: 20 }],
        },
      ],
    } satisfies IJsonGraph);
    applyHints(graph, [pinPosition('inner', 999, 999)]);
    const inner = graph.children[0]?.children[0];
    expect(inner?.x).toBe(999);
    expect(inner?.y).toBe(999);
  });
});
