/**
 * Public surface of @filigree/hints — the human hint subsystem.
 *
 * Filigree's deliberate divergence from upstream ELK. A hint is a soft
 * constraint that lets a human authoring the diagram nudge a specific
 * layout decision without writing algorithm code.
 *
 * Current POC ships one kind: `PinPosition` — lock a node at fixed (x, y).
 * Planned: SameLayer, OrderBefore, Group, Focus.
 */

export { HintKind } from './hint-kind.js';
export type { IHint } from './i-hint.js';
export { type IPinPositionHint, pinPosition } from './pin-position-hint.js';
export { applyHints } from './apply-hints.js';
