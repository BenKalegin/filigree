/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Helpers shared by every layered node placer.
 *
 * `layerHeight` is the maximum node height in a layer — used by the engine
 * to compute the next layer's y. `placeNodesLinearly` is the width-aware
 * initial placement loop reused by `LinearNodePlacer` and `BalancedNodePlacer`.
 */

import { type LNode } from './l-node.js';

export const layerHeight = (layer: readonly LNode[]): number =>
  layer.reduce((max, n) => Math.max(max, n.elkNode.height), 0);

export const placeNodesLinearly = (
  layers: readonly (readonly LNode[])[],
  nodeGap: number,
  layerGap: number,
): void => {
  let currentY = 0;
  for (const layer of layers) {
    let x = 0;
    for (const node of layer) {
      node.setPosition(x, currentY);
      x += node.elkNode.width + nodeGap;
    }
    currentY += layerHeight(layer) + layerGap;
  }
};
