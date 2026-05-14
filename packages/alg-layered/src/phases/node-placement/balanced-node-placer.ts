/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Single-pass balanced node placer.
 *
 * After a width-aware initial placement, walks each layer top-to-bottom and
 * shifts every node toward the average x-center of its connected neighbors
 * (predecessors + successors). A `leftBound` enforces non-overlap within
 * each layer — nodes may move left, but never past their preceding sibling
 * plus the configured gap.
 *
 * Not a real Brandes-Köpf — single-pass, no alignment-and-median averaging
 * — but produces visibly straighter chains and centered merges. The full
 * Brandes-Köpf implementation lives in `BrandesKopfNodePlacer`.
 */

import { LayeredPhase } from '../../enums.js';
import { type INodePlacer } from '../../i-node-placer.js';
import { placeNodesLinearly } from '../../model/layer-utils.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';
import { LayeredOptions } from '../../layered-options.js';

export class BalancedNodePlacer implements INodePlacer {
  public readonly phase = LayeredPhase.NodePlacement;

  public execute(context: LayeredContext): void {
    const nodeGap = context.options.resolve(LayeredOptions.spacingNodeNode, context.graph);
    const layerGap = context.options.resolve(LayeredOptions.spacingLayer, context.graph);
    placeNodesLinearly(context.layers, nodeGap, layerGap);
    for (const layer of context.layers) {
      this.balanceLayer(layer, context, nodeGap);
    }
  }

  private balanceLayer(layer: readonly LNode[], context: LayeredContext, nodeGap: number): void {
    let leftBound = 0;
    for (const node of layer) {
      const desiredX = this.computeDesiredX(node, context);
      const newX = Math.max(desiredX, leftBound);
      node.setPosition(newX, node.y);
      leftBound = newX + node.elkNode.width + nodeGap;
    }
  }

  private computeDesiredX(node: LNode, context: LayeredContext): number {
    const neighbors = [...context.predecessorsOf(node), ...context.successorsOf(node)];
    if (neighbors.length === 0) {
      return node.x;
    }
    const totalCenter = neighbors.reduce((sum, n) => sum + n.x + n.elkNode.width / 2, 0);
    const avgCenter = totalCenter / neighbors.length;
    return avgCenter - node.elkNode.width / 2;
  }
}
