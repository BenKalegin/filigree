/**
 * Pin a node to a specific absolute position.
 *
 * Applied after the layout algorithm finishes. The pinned node's computed
 * (x, y) is overridden with the hint's coordinates; edges already routed
 * through that node may need re-routing in the consumer — for the current
 * POC we accept the routing artefact and document it.
 *
 * Use case: the author wants a specific node in a specific spot
 * (e.g. "Start" always at the top-left, regardless of what the algorithm
 * decides) without forking the algorithm or post-processing every output.
 */

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';

export interface IPinPositionHint extends IHint {
  readonly kind: HintKind.PinPosition;
  readonly nodeId: string;
  readonly x: number;
  readonly y: number;
}

export const pinPosition = (nodeId: string, x: number, y: number): IPinPositionHint => ({
  kind: HintKind.PinPosition,
  nodeId,
  x,
  y,
});
