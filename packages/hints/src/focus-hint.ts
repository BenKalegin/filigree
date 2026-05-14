/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Translate the laid-out graph so a chosen node's center ends up at a
 * specified position (default: origin).
 *
 * Applied post-layout by `applyHints`, so the algorithm's relative
 * geometry is untouched — every node position and every edge bend
 * point gets the same translation. The focus node simply becomes the
 * coordinate anchor.
 *
 * Useful for "center the diagram around this node" rendering modes
 * where the viewer pans/zooms around a focal point. Inapplicable to
 * graphs whose layout has not yet run (positions still zero); the
 * hint silently produces a no-op in that case.
 */

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';

export interface IFocusHint extends IHint {
  readonly kind: HintKind.Focus;
  readonly nodeId: string;
  readonly centerX: number;
  readonly centerY: number;
}

export const focus = (nodeId: string, centerX = 0, centerY = 0): IFocusHint => ({
  kind: HintKind.Focus,
  nodeId,
  centerX,
  centerY,
});
