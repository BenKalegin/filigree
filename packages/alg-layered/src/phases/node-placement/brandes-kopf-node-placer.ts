/*******************************************************************************
 * Copyright (c) 2012, 2015 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p4nodes/bk/BKNodePlacer.java
 *******************************************************************************/

/**
 * Brandes-Köpf-style horizontal coordinate assignment (4 alignments).
 *
 * Builds four independent block alignments by sweeping the layer
 * partition in each combination of (vertical × horizontal) direction:
 *
 *   - UP-LEFT  / UP-RIGHT   — top-down, align to median predecessor.
 *   - DOWN-LEFT / DOWN-RIGHT — bottom-up, align to median successor.
 *
 * Each alignment is compacted left-to-right to its tightest non-
 * overlapping x. The final x of every node is the median of the four
 * candidate x-coordinates — individual alignment artifacts cancel out,
 * so wide-fanout nodes don't pull narrow blocks lopsided.
 *
 * Alignment + compaction details live in `./bk-alignment.ts`; this file
 * is the orchestrator that runs the four passes and median-combines.
 */

import { LayeredPhase } from '../../enums.js';
import { type INodePlacer } from '../../i-node-placer.js';
import { layerHeight } from '../../model/layer-utils.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';
import { LayeredOptions } from '../../layered-options.js';
import {
  computeAlignmentXs,
  HorizontalDirection,
  VerticalDirection,
} from './bk-alignment.js';

interface IDirectionPair {
  readonly vertical: VerticalDirection;
  readonly horizontal: HorizontalDirection;
}

const ALL_DIRECTIONS: readonly IDirectionPair[] = [
  { vertical: VerticalDirection.Up, horizontal: HorizontalDirection.LeftToRight },
  { vertical: VerticalDirection.Up, horizontal: HorizontalDirection.RightToLeft },
  { vertical: VerticalDirection.Down, horizontal: HorizontalDirection.LeftToRight },
  { vertical: VerticalDirection.Down, horizontal: HorizontalDirection.RightToLeft },
];

export class BrandesKopfNodePlacer implements INodePlacer {
  public readonly phase = LayeredPhase.NodePlacement;

  public execute(context: LayeredContext): void {
    const nodeGap = context.options.resolve(LayeredOptions.spacingNodeNode, context.graph);
    const layerGap = context.options.resolve(LayeredOptions.spacingLayer, context.graph);
    this.placeY(context, layerGap);
    const alignmentXs = ALL_DIRECTIONS.map((d) =>
      computeAlignmentXs(context, d.vertical, d.horizontal, nodeGap),
    );
    this.applyMedianXs(context, alignmentXs);
  }

  private placeY(context: LayeredContext, layerGap: number): void {
    let currentY = 0;
    for (const layer of context.layers) {
      for (const node of layer) {
        node.setPosition(node.x, currentY);
      }
      currentY += layerHeight(layer) + layerGap;
    }
  }

  private applyMedianXs(
    context: LayeredContext,
    alignmentXs: readonly ReadonlyMap<LNode, number>[],
  ): void {
    for (const node of context.nodes) {
      const xs = alignmentXs.map((m) => m.get(node) ?? 0);
      node.setPosition(medianOfFour(xs), node.y);
    }
  }
}

// Median of 4 values = average of the two middle values after sort. Cancels
// out the most extreme alignment per node without weighting them equally
// like a plain mean would.
const medianOfFour = (xs: readonly number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid1 = sorted[1] ?? 0;
  const mid2 = sorted[2] ?? 0;
  return (mid1 + mid2) / 2;
};
