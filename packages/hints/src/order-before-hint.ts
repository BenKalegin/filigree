/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Force `nodeAId` to sit to the left of `nodeBId` within a layer.
 *
 * Read by the layered algorithm via `HintAwareCrossingMinimizer`. After
 * the chosen crossing minimizer runs, if both nodes share a layer and the
 * order is reversed, they're swapped. Hints take precedence over
 * crossing-reduction in that layer.
 *
 * If the nodes end up in different layers (e.g. because of a `SameLayer`
 * hint that hasn't fired or because the algorithm naturally put them
 * apart), the hint is silently ignored.
 */

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';

export interface IOrderBeforeHint extends IHint {
  readonly kind: HintKind.OrderBefore;
  readonly nodeAId: string;
  readonly nodeBId: string;
}

export const orderBefore = (nodeAId: string, nodeBId: string): IOrderBeforeHint => ({
  kind: HintKind.OrderBefore,
  nodeAId,
  nodeBId,
});
