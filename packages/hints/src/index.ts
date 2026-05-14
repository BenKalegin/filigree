/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @filigree/hints — the human hint subsystem.
 *
 * Filigree's deliberate divergence from upstream ELK. A hint is a soft
 * constraint that lets a human authoring the diagram nudge a specific
 * layout decision without writing algorithm code.
 *
 * Hints come in two flavors:
 *   - **Post-layout** — `PinPosition`. Applied by `applyHints(graph, …)`
 *     *after* the algorithm finishes; overrides the algorithm's chosen
 *     coordinates for the named node.
 *   - **In-layout** — `SameLayer`, `OrderBefore`, `Group`. Honored by the
 *     layered algorithm's decorators during the appropriate phase. Attach
 *     them to the graph via `attachHints(graph, [...])` and the decorated
 *     pipeline reads them automatically.
 *
 * Planned: `Focus`.
 */

export { HintKind } from './hint-kind.js';
export type { IHint } from './i-hint.js';
export { type IPinPositionHint, pinPosition } from './pin-position-hint.js';
export { type ISameLayerHint, sameLayer } from './same-layer-hint.js';
export { type IOrderBeforeHint, orderBefore } from './order-before-hint.js';
export { type IGroupHint, group } from './group-hint.js';
export { type IFocusHint, focus } from './focus-hint.js';
export { attachHints, getHints } from './hints-option.js';
export { applyHints } from './apply-hints.js';
export { parseJsonHints } from './json-hints.js';
