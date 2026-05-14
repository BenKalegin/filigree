/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * JSON shape for human hints attached to a graph via `filigreeHints` on the
 * root JSON object.
 *
 * Mirrors the in-code factories (`orderBefore`, `sameLayer`, `group`,
 * `pinPosition`, `focus`) but with field names tuned to read well in JSON:
 *
 * ```json
 * {
 *   "filigreeHints": [
 *     { "kind": "OrderBefore", "before": "n1", "after": "n2" },
 *     { "kind": "SameLayer",  "nodes":  ["n3", "n4"] },
 *     { "kind": "Group",      "nodes":  ["task_a", "task_c", "task_e"] },
 *     { "kind": "PinPosition", "node": "start", "x": 0, "y": 0 },
 *     { "kind": "Focus",      "node": "main" }
 *   ]
 * }
 * ```
 *
 * Hints that don't match any known kind, are missing required fields, or
 * have the wrong field types are dropped silently — same soft-constraint
 * semantic as the code-level hint applicators.
 */

import { type IJsonHint } from '@benkalegin/filigree-graph';

import { focus, type IFocusHint } from './focus-hint.js';
import { group, type IGroupHint } from './group-hint.js';
import { type IHint } from './i-hint.js';
import { orderBefore, type IOrderBeforeHint } from './order-before-hint.js';
import { pinPosition, type IPinPositionHint } from './pin-position-hint.js';
import { sameLayer, type ISameLayerHint } from './same-layer-hint.js';

const Kinds = {
  OrderBefore: 'OrderBefore',
  SameLayer: 'SameLayer',
  Group: 'Group',
  PinPosition: 'PinPosition',
  Focus: 'Focus',
} as const;

const SAME_LAYER_NODE_COUNT = 2;

export const parseJsonHints = (raw?: readonly IJsonHint[]): readonly IHint[] => {
  if (raw === undefined) return [];
  const parsed: IHint[] = [];
  for (const entry of raw) {
    const hint = parseOne(entry);
    if (hint !== undefined) parsed.push(hint);
  }
  return parsed;
};

const parseOne = (raw: IJsonHint): IHint | undefined => {
  switch (raw.kind) {
    case Kinds.OrderBefore: {
      return parseOrderBefore(raw);
    }
    case Kinds.SameLayer: {
      return parseSameLayer(raw);
    }
    case Kinds.Group: {
      return parseGroup(raw);
    }
    case Kinds.PinPosition: {
      return parsePinPosition(raw);
    }
    case Kinds.Focus: {
      return parseFocus(raw);
    }
    default: {
      return undefined;
    }
  }
};

const parseOrderBefore = (raw: IJsonHint): IOrderBeforeHint | undefined => {
  const before = raw.before;
  const after = raw.after;
  if (typeof before !== 'string' || typeof after !== 'string') return undefined;
  return orderBefore(before, after);
};

const parseSameLayer = (raw: IJsonHint): ISameLayerHint | undefined => {
  const ids = parseStringArray(raw.nodes);
  if (ids?.length !== SAME_LAYER_NODE_COUNT) return undefined;
  const [a, b] = ids;
  if (a === undefined || b === undefined) return undefined;
  return sameLayer(a, b);
};

const parseGroup = (raw: IJsonHint): IGroupHint | undefined => {
  const ids = parseStringArray(raw.nodes);
  if (ids === undefined || ids.length === 0) return undefined;
  return group(ids);
};

const parsePinPosition = (raw: IJsonHint): IPinPositionHint | undefined => {
  const node = raw.node;
  const x = raw.x;
  const y = raw.y;
  if (typeof node !== 'string' || typeof x !== 'number' || typeof y !== 'number') return undefined;
  return pinPosition(node, x, y);
};

const parseFocus = (raw: IJsonHint): IFocusHint | undefined => {
  const node = raw.node;
  if (typeof node !== 'string') return undefined;
  const centerX = typeof raw.centerX === 'number' ? raw.centerX : 0;
  const centerY = typeof raw.centerY === 'number' ? raw.centerY : 0;
  return focus(node, centerX, centerY);
};

const parseStringArray = (raw: unknown): readonly string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const result: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') return undefined;
    result.push(entry);
  }
  return result;
};
