/*******************************************************************************
 * Copyright (c) 2018, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.rectpacking/src/org/eclipse/elk/alg/rectpacking/RectPackingLayoutProvider.java
 *******************************************************************************/

/**
 * Rectpacking — compact, edge-free rectangle packing.
 *
 * Targets the "lay out a collection of cards with no relationships" case.
 * Edges are ignored entirely; the algorithm only positions rectangles
 * (the user's nodes) within a target aspect ratio.
 *
 * Approach: shelf packing.
 *   1. Sort nodes by descending area (largest first) so big tiles anchor
 *      each shelf and leave less awkward whitespace.
 *   2. Compute a target row width as `sqrt(totalArea * aspectRatio)`.
 *   3. Walk nodes in order, placing each at the right edge of the current
 *      row if it fits, or starting a new row at `current bottom + gap`.
 *   4. Each row's height is the max node height in that row (the shelf).
 *
 * Linear time. Far simpler than ELK's full three-phase rectpacking
 * (width approximation → packing → whitespace elimination), but produces
 * acceptable layouts for the common "dashboard of similar-sized cards"
 * shape. The full algorithm is a future iteration.
 */

import { type ILayoutAlgorithm, type ILayoutContext } from '@filigree/core';
import { type INode } from '@filigree/graph';

import { RectPackingOptions } from './rectpacking-options.js';

export const RECTPACKING_ALGORITHM_ID = 'rectpacking';
export const RECTPACKING_DISPLAY_NAME = 'Rectpacking';

interface IPlacementSettings {
  readonly nodeGap: number;
  readonly targetWidth: number;
}

export class RectPackingAlgorithm implements ILayoutAlgorithm {
  public readonly id = RECTPACKING_ALGORITHM_ID;
  public readonly displayName = RECTPACKING_DISPLAY_NAME;

  public run(context: ILayoutContext): Promise<void> {
    const nodes = context.graph.children;
    if (nodes.length === 0) return Promise.resolve();
    const settings = this.readSettings(context, nodes);
    const sorted = [...nodes].sort(byDescendingArea);
    packShelves(sorted, settings);
    return Promise.resolve();
  }

  private readSettings(
    context: ILayoutContext,
    nodes: readonly INode[],
  ): IPlacementSettings {
    const nodeGap = context.options.resolve(RectPackingOptions.nodeGap, context.graph);
    const aspectRatio = context.options.resolve(
      RectPackingOptions.aspectRatio,
      context.graph,
    );
    const totalArea = nodes.reduce((sum, n) => sum + n.width * n.height, 0);
    const targetWidth = Math.sqrt(totalArea * Math.max(aspectRatio, MIN_ASPECT_RATIO));
    return { nodeGap, targetWidth };
  }
}

// Clamp pathological aspect-ratio inputs so the shelf-width formula can't
// collapse to zero (which would put every node on a row by itself).
const MIN_ASPECT_RATIO = 0.1;

const byDescendingArea = (a: INode, b: INode): number =>
  b.width * b.height - a.width * a.height;

const packShelves = (sorted: readonly INode[], settings: IPlacementSettings): void => {
  let rowX = 0;
  let rowY = 0;
  let rowHeight = 0;
  for (const node of sorted) {
    const needsNewRow = rowX > 0 && rowX + node.width > settings.targetWidth;
    if (needsNewRow) {
      rowY += rowHeight + settings.nodeGap;
      rowX = 0;
      rowHeight = 0;
    }
    node.setPosition(rowX, rowY);
    rowX += node.width + settings.nodeGap;
    rowHeight = Math.max(rowHeight, node.height);
  }
};
