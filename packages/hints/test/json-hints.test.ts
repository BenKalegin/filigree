/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Per-kind parsing of the `filigreeHints` JSON shape. Malformed inputs are
 * dropped silently — same soft-constraint semantic as the in-code hints.
 */

import { describe, expect, it } from 'vitest';

import { HintKind } from '../src/hint-kind.js';
import { parseJsonHints } from '../src/json-hints.js';

describe('parseJsonHints', () => {
  it('returns empty for missing input', () => {
    expect(parseJsonHints()).toEqual([]);
  });

  it('parses OrderBefore', () => {
    const [hint] = parseJsonHints([{ kind: 'OrderBefore', before: 'a', after: 'b' }]);
    expect(hint?.kind).toBe(HintKind.OrderBefore);
    expect(hint).toMatchObject({ nodeAId: 'a', nodeBId: 'b' });
  });

  it('parses SameLayer with exactly two nodes', () => {
    const [hint] = parseJsonHints([{ kind: 'SameLayer', nodes: ['a', 'b'] }]);
    expect(hint?.kind).toBe(HintKind.SameLayer);
    expect(hint).toMatchObject({ nodeAId: 'a', nodeBId: 'b' });
  });

  it('drops SameLayer with the wrong number of nodes', () => {
    expect(parseJsonHints([{ kind: 'SameLayer', nodes: ['a'] }])).toEqual([]);
    expect(parseJsonHints([{ kind: 'SameLayer', nodes: ['a', 'b', 'c'] }])).toEqual([]);
  });

  it('parses Group', () => {
    const [hint] = parseJsonHints([{ kind: 'Group', nodes: ['a', 'b', 'c'] }]);
    expect(hint?.kind).toBe(HintKind.Group);
    expect(hint).toMatchObject({ nodeIds: ['a', 'b', 'c'] });
  });

  it('drops Group with an empty nodes array', () => {
    expect(parseJsonHints([{ kind: 'Group', nodes: [] }])).toEqual([]);
  });

  it('parses PinPosition', () => {
    const [hint] = parseJsonHints([{ kind: 'PinPosition', node: 'start', x: 10, y: 20 }]);
    expect(hint?.kind).toBe(HintKind.PinPosition);
    expect(hint).toMatchObject({ nodeId: 'start', x: 10, y: 20 });
  });

  it('parses Focus with defaults', () => {
    const [hint] = parseJsonHints([{ kind: 'Focus', node: 'center' }]);
    expect(hint?.kind).toBe(HintKind.Focus);
    expect(hint).toMatchObject({ nodeId: 'center', centerX: 0, centerY: 0 });
  });

  it('parses Focus with explicit center', () => {
    const [hint] = parseJsonHints([
      { kind: 'Focus', node: 'center', centerX: 100, centerY: 200 },
    ]);
    expect(hint).toMatchObject({ nodeId: 'center', centerX: 100, centerY: 200 });
  });

  it('drops unknown kinds and malformed entries', () => {
    const parsed = parseJsonHints([
      { kind: 'OrderBefore', before: 'a', after: 'b' },
      { kind: 'NotAHint', stuff: 'whatever' },
      { kind: 'OrderBefore' },
      { kind: 'PinPosition', node: 'x' },
    ]);
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.kind).toBe(HintKind.OrderBefore);
  });
});
