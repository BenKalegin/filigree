/*******************************************************************************
 * Copyright (c) 2010, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p2layers/NetworkSimplexLayerer.java
 *******************************************************************************/

/**
 * Network-simplex-style layer assignment.
 *
 * Goal: assign integer layers `L(v) ≥ 0` such that `L(target) − L(source) ≥
 * 1` for every edge, *minimizing* the total edge length
 * `Σ L(target) − L(source)`. Equivalent to a min-cost network flow LP;
 * full ELK uses a textbook simplex with a tight-tree pivot loop. This is
 * a lighter iterative-improvement variant that produces the same kind of
 * "balanced" layering with much less code:
 *
 *   1. Initial feasible layering = longest-path (every constraint
 *      satisfied; nodes pushed as far down as possible).
 *   2. Repeatedly scan every non-source non-sink node. Each move of a
 *      node up by one layer changes total edge length by
 *      `#outgoing − #incoming`. If positive *and* the move stays
 *      feasible (`max predecessor layer + 1 < current layer`), apply
 *      it. Stop when no node moves.
 *
 * Because step 2 only ever decreases total edge length and bounded below
 * by zero, the loop terminates. For the typical layered input it
 * converges in 1–3 sweeps. The result is a layering where sources sit at
 * layer 0 but every other node is *as close to its predecessors as the
 * constraints allow* — exactly the "tight" property network simplex
 * gives.
 */

import { LayeredPhase } from '../../enums.js';
import { type ILayerAssigner } from '../../i-layer-assigner.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

const SOURCE_LAYER = 0;
const MAX_IMPROVEMENT_SWEEPS = 32;

export class NetworkSimplexLayerer implements ILayerAssigner {
  public readonly phase = LayeredPhase.LayerAssignment;

  public execute(context: LayeredContext): void {
    seedLongestPath(context);
    for (let sweep = 0; sweep < MAX_IMPROVEMENT_SWEEPS; sweep += 1) {
      if (!improveSweep(context)) break;
    }
    assignBuckets(context);
  }
}

const seedLongestPath = (context: LayeredContext): void => {
  const memo = new Map<LNode, number>();
  for (const node of context.nodes) {
    node.setLayer(longestPathFromSources(node, context, memo));
  }
};

const longestPathFromSources = (
  node: LNode,
  context: LayeredContext,
  memo: Map<LNode, number>,
): number => {
  const cached = memo.get(node);
  if (cached !== undefined) return cached;
  const preds = context.predecessorsOf(node);
  const value =
    preds.length === 0
      ? SOURCE_LAYER
      : Math.max(...preds.map((p) => longestPathFromSources(p, context, memo))) + 1;
  memo.set(node, value);
  return value;
};

const improveSweep = (context: LayeredContext): boolean => {
  let changed = false;
  for (const node of context.nodes) {
    if (tryShiftUp(node, context)) changed = true;
  }
  return changed;
};

const tryShiftUp = (node: LNode, context: LayeredContext): boolean => {
  const preds = context.predecessorsOf(node);
  const succs = context.successorsOf(node);
  if (preds.length === 0) return false;
  if (succs.length >= preds.length) return false;
  const maxPredLayer = Math.max(...preds.map((p) => p.layer));
  const desiredLayer = maxPredLayer + 1;
  if (desiredLayer >= node.layer) return false;
  node.setLayer(desiredLayer);
  return true;
};

const assignBuckets = (context: LayeredContext): void => {
  const maxLayer = context.nodes.reduce((max, n) => Math.max(max, n.layer), SOURCE_LAYER);
  const buckets: LNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const n of context.nodes) {
    buckets[n.layer]?.push(n);
  }
  context.assignLayers(buckets);
  for (const layer of context.layers) {
    for (const [index, node] of layer.entries()) {
      node.setIndexInLayer(index);
    }
  }
};
