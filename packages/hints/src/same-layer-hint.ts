/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Force two nodes onto the same layer in a layered layout.
 *
 * Read by the layered algorithm via `HintAwareLayerer`. If the two nodes
 * land on different layers after the chosen layerer runs, both are pushed
 * to `max(layerA, layerB)` so the constraint is satisfied and downstream
 * edges still flow downward.
 *
 * Inapplicable to non-layered algorithms (force, radial, mrtree); they
 * simply ignore the hint.
 */

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';

export interface ISameLayerHint extends IHint {
  readonly kind: HintKind.SameLayer;
  readonly nodeAId: string;
  readonly nodeBId: string;
}

export const sameLayer = (nodeAId: string, nodeBId: string): ISameLayerHint => ({
  kind: HintKind.SameLayer,
  nodeAId,
  nodeBId,
});
