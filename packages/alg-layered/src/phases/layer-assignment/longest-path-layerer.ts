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
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p2layers/LongestPathLayerer.java
 *******************************************************************************/

/**
 * Longest-path layer assignment.
 *
 * Each node's layer is `max(predecessor.layer) + 1`, with sources at layer 0.
 * Produces a topological layering where every edge points downward by exactly
 * one or more layers. Simplest correct layerer; tight layers come later via
 * network-simplex.
 *
 * Algorithm assumes the input is a DAG (the cycle-breaking phase enforces
 * that). Running on a graph with cycles will produce undefined behavior.
 */

import { LayeredPhase } from '../../enums.js';
import { type ILayerAssigner } from '../../i-layer-assigner.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

const SOURCE_LAYER = 0;

export class LongestPathLayerer implements ILayerAssigner {
  public readonly phase = LayeredPhase.LayerAssignment;

  public execute(context: LayeredContext): void {
    const memo = new Map<LNode, number>();
    for (const node of context.nodes) {
      node.setLayer(this.layerOf(node, context, memo));
    }
    context.assignLayers(this.bucketByLayer(context.nodes));
    this.assignIndexInLayer(context);
  }

  private layerOf(node: LNode, context: LayeredContext, memo: Map<LNode, number>): number {
    const cached = memo.get(node);
    if (cached !== undefined) {
      return cached;
    }
    const preds = context.predecessorsOf(node);
    const value =
      preds.length === 0
        ? SOURCE_LAYER
        : Math.max(...preds.map((p) => this.layerOf(p, context, memo))) + 1;
    memo.set(node, value);
    return value;
  }

  private bucketByLayer(nodes: readonly LNode[]): LNode[][] {
    const maxLayer = nodes.reduce((max, n) => Math.max(max, n.layer), SOURCE_LAYER);
    const buckets: LNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
    for (const n of nodes) {
      buckets[n.layer]?.push(n);
    }
    return buckets;
  }

  private assignIndexInLayer(context: LayeredContext): void {
    for (const layer of context.layers) {
      for (const [index, node] of layer.entries()) {
        node.setIndexInLayer(index);
      }
    }
  }
}
