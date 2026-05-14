/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Options that the core engine itself reads, independent of any algorithm.
 *
 * Algorithm packages declare their own options in their own modules. These
 * here are the minimum the engine needs to dispatch a layout.
 */

import { defineProperty, EdgeRoutingStyle, LayoutDirection } from '@benkalegin/filigree-graph';

import { OptionScope } from './enums.js';
import { type IOption } from './i-option.js';

export const AlgorithmOption: IOption<string> = {
  property: defineProperty<string>({ id: 'elk.algorithm', defaultValue: 'layered' }),
  name: 'Layout algorithm',
  description: 'Identifier of the layout algorithm to run for this graph.',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};

const DEFAULT_COMPOUND_PADDING = 20;

/**
 * Padding between a compound node's border and its children. The engine
 * resizes every compound to `children-bbox + 2 × padding` after the
 * algorithm finishes; set this on the root for a uniform value, or on a
 * specific compound to override locally.
 */
export const CompoundPaddingOption: IOption<number> = {
  property: defineProperty<number>({
    id: 'elk.padding',
    defaultValue: DEFAULT_COMPOUND_PADDING,
  }),
  name: 'Compound padding',
  description: 'Distance between a compound node and its children on every side.',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};

/**
 * Primary flow direction of the layout. ELK convention: `'DOWN'` for top-to-
 * bottom (the default), `'RIGHT'` for left-to-right, `'UP'` for bottom-to-top,
 * `'LEFT'` for right-to-left. Lowercase variants (`'down'`, …) are accepted
 * to keep filigree-native enum values usable as wire values.
 *
 * Algorithm-level honoring: layered respects this option. Force / mrtree /
 * radial / stress / rectpacking layouts have no inherent direction and
 * ignore it.
 */
export const DirectionOption: IOption<LayoutDirection> = {
  property: defineProperty<LayoutDirection>({
    id: 'elk.direction',
    defaultValue: LayoutDirection.Down,
  }),
  name: 'Layout direction',
  description: 'Primary flow direction of edges: DOWN (TB), RIGHT (LR), UP (BT), or LEFT (RL).',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};

const DIRECTION_VALUES: ReadonlySet<string> = new Set([
  LayoutDirection.Right,
  LayoutDirection.Left,
  LayoutDirection.Down,
  LayoutDirection.Up,
  LayoutDirection.Undefined,
]);

/**
 * Coerce raw option input — either an ELK-style uppercase wire string
 * (`'RIGHT'`) or a filigree-native enum value (`'right'`) — to the
 * `LayoutDirection` enum. Anything unrecognized falls back to `Down`,
 * matching ELK's behavior of treating `Undefined` as down for layered.
 */
export const normalizeDirection = (raw: unknown): LayoutDirection => {
  if (typeof raw !== 'string') return LayoutDirection.Down;
  const lower = raw.toLowerCase();
  if (!DIRECTION_VALUES.has(lower)) return LayoutDirection.Down;
  const direction = lower as LayoutDirection;
  return direction === LayoutDirection.Undefined ? LayoutDirection.Down : direction;
};

/**
 * How edges are routed after node placement. Layered honors this option:
 *
 *   - `ORTHOGONAL` (default) — two-bend orthogonal router with parallel-edge
 *     awareness; emits bend points on every contained edge.
 *   - `OFF` — skips the routing phase entirely; edges keep empty bend-point
 *     lists so the renderer draws a straight line from source to target.
 *     Use this when the host has its own router (e.g. an obstacle-aware
 *     polyline pass).
 *   - `POLYLINE` — currently aliased to `OFF`; obstacle-aware polyline
 *     routing is a future iteration.
 *   - `SPLINES` — currently aliased to `ORTHOGONAL`; spline routing is not
 *     yet ported.
 *
 * Lowercase wire values (`'orthogonal'`, …) are accepted alongside the ELK
 * uppercase form.
 */
export const EdgeRoutingOption: IOption<EdgeRoutingStyle> = {
  property: defineProperty<EdgeRoutingStyle>({
    id: 'elk.edgeRouting',
    defaultValue: EdgeRoutingStyle.Orthogonal,
  }),
  name: 'Edge routing',
  description: 'Routing strategy for edges: OFF, ORTHOGONAL, POLYLINE, or SPLINES.',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};

const EDGE_ROUTING_VALUES: ReadonlySet<string> = new Set([
  EdgeRoutingStyle.Off,
  EdgeRoutingStyle.Polyline,
  EdgeRoutingStyle.Orthogonal,
  EdgeRoutingStyle.Splines,
  EdgeRoutingStyle.Undefined,
]);

/**
 * Coerce raw option input to an `EdgeRoutingStyle`. Unknown values fall back
 * to `Orthogonal` (the layered default). `Undefined` is collapsed to
 * `Orthogonal` so consumers don't have to special-case it.
 */
export const normalizeEdgeRouting = (raw: unknown): EdgeRoutingStyle => {
  if (typeof raw !== 'string') return EdgeRoutingStyle.Orthogonal;
  const lower = raw.toLowerCase();
  if (!EDGE_ROUTING_VALUES.has(lower)) return EdgeRoutingStyle.Orthogonal;
  const style = lower as EdgeRoutingStyle;
  return style === EdgeRoutingStyle.Undefined ? EdgeRoutingStyle.Orthogonal : style;
};
