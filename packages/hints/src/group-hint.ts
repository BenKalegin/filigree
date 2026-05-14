/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Ask the layout to keep a set of nodes visually clustered.
 *
 * Read by the layered algorithm via `HintAwareCrossingMinimizer`. Within
 * each layer that holds two or more members, the group is shuffled to be
 * contiguous, starting at the leftmost member's current index. Members
 * on different layers stay where they are — group is not promoted to a
 * same-layer constraint, that's `SameLayer`'s job.
 *
 * Inapplicable to non-layered algorithms (force, radial, mrtree) for the
 * moment; they ignore the hint.
 */

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';

export interface IGroupHint extends IHint {
  readonly kind: HintKind.Group;
  readonly nodeIds: readonly string[];
}

export const group = (nodeIds: readonly string[]): IGroupHint => ({
  kind: HintKind.Group,
  nodeIds,
});
