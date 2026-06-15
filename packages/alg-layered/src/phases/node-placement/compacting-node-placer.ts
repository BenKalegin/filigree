/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Rank-rigid horizontal compaction, layered on top of an inner placer.
 *
 * The inner placer (Brandes-Köpf) straightens edges *within* the freedom each
 * layer has, but at the compound/root level whole layers can drift sideways
 * relative to one another — a cluster cascade that reads as a diagonal sprawl,
 * because cross-compound edges connect at cluster borders rather than pulling
 * the layers into vertical alignment.
 *
 * This pass shifts each layer by a single x-offset chosen to minimise the total
 * cross-axis distance of the edges incident to that layer (the L1 optimum is
 * the median of the per-edge endpoint deltas), iterating a few rounds of
 * coordinate descent. Because every node in a layer moves by the *same* amount,
 * within-layer order and spacing are preserved — so the pass can introduce
 * neither node overlaps nor new edge crossings; it only removes inter-layer
 * slack. The whole result is re-anchored afterwards to keep the original left
 * margin.
 */

import { LayeredPhase } from '../../enums.js';
import { type INodePlacer } from '../../i-node-placer.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

const COMPACTION_ROUNDS = 8;
// A layer whose optimal shift is smaller than this is left alone — avoids
// sub-pixel churn and lets the descent converge.
const MIN_SHIFT_PX = 0.5;

export class CompactingNodePlacer implements INodePlacer {
  public readonly phase = LayeredPhase.NodePlacement;

  constructor(private readonly inner: INodePlacer) {}

  public execute(context: LayeredContext): void {
    this.inner.execute(context);
    this.compact(context);
  }

  private compact(context: LayeredContext): void {
    if (!this.shouldCompact(context)) return;
    const layers = context.layers;
    const originalMinX = this.minX(layers);
    this.runDescent(layers, context);
    this.reanchor(layers, originalMinX);
  }

  /**
   * Only the root layout with two or more clusters drifts diagonally — that is
   * where clusters and loose nodes share layers and cross-compound edges pull
   * whole layers sideways. A compound's *internal* layout, and any plain or
   * single-cluster graph, is already aligned by the inner placer; a rigid layer
   * nudge there only risks knocking carefully-centred rows off their baseline.
   */
  private shouldCompact(context: LayeredContext): boolean {
    if (context.graph.parent !== null) return false;
    if (context.layers.length < 2) return false;
    const clusterCount = context.graph.children.filter((c) => c.children.length > 0).length;
    return clusterCount >= 2;
  }

  private runDescent(layers: readonly (readonly LNode[])[], context: LayeredContext): void {
    for (let round = 0; round < COMPACTION_ROUNDS; round++) {
      let movedAny = false;
      for (const layer of layers) {
        const shift = this.optimalShift(layer, context);
        if (Math.abs(shift) < MIN_SHIFT_PX) continue;
        for (const node of layer) node.setPosition(node.x + shift, node.y);
        movedAny = true;
      }
      if (!movedAny) break;
    }
  }

  /**
   * The x-shift for `layer` that minimises the summed cross-axis edge distance
   * to its current neighbours: the median over every incident edge of
   * (neighbourCenterX − nodeCenterX).
   */
  private optimalShift(layer: readonly LNode[], context: LayeredContext): number {
    const deltas: number[] = [];
    for (const node of layer) {
      const centerX = node.x + node.width / 2;
      for (const n of context.successorsOf(node)) deltas.push(n.x + n.width / 2 - centerX);
      for (const n of context.predecessorsOf(node)) deltas.push(n.x + n.width / 2 - centerX);
    }
    if (deltas.length === 0) return 0;
    return median(deltas);
  }

  private minX(layers: readonly (readonly LNode[])[]): number {
    let min = Infinity;
    for (const layer of layers) for (const node of layer) min = Math.min(min, node.x);
    return min;
  }

  private reanchor(layers: readonly (readonly LNode[])[], originalMinX: number): void {
    const delta = originalMinX - this.minX(layers);
    if (Math.abs(delta) < MIN_SHIFT_PX) return;
    for (const layer of layers) for (const node of layer) node.setPosition(node.x + delta, node.y);
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const high = sorted[mid] ?? 0;
  if (sorted.length % 2 !== 0) return high;
  const low = sorted[mid - 1] ?? high;
  return (low + high) / 2;
}
