/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Copies positions from the intermediate `LNode`s back to the user-visible
 * `ElkNode`s. The only place the input graph is mutated by the algorithm.
 */

import { type LayeredContext } from './model/layered-context.js';

export class LayeredResultApplier {
  public apply(context: LayeredContext): void {
    for (const node of context.nodes) {
      node.elkNode.setPosition(node.x, node.y);
    }
  }
}
