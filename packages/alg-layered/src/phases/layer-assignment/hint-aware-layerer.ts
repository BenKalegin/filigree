/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Decorator that wraps any `ILayerAssigner` and applies `SameLayer` hints
 * after it runs.
 *
 * For each `SameLayer(a, b)` hint:
 *   - Both nodes are pushed to `max(layer(a), layer(b))`. We push *up*
 *     because moving a node *down* a layer can leave its predecessors
 *     above it (preserving the DAG); pushing up would risk violating
 *     successor relationships when the lower of the two is constrained.
 *   - Layer partition is rebuilt from the updated `LNode.layer` values.
 *   - `indexInLayer` is reassigned by the current layer-array position
 *     (sufficient for the subsequent crossing-minimization phase to
 *     reshuffle them).
 *
 * Hints referencing unknown node ids are silently ignored.
 */

import { getHints, HintKind, type ISameLayerHint } from '@filigree/hints';

import { LayeredPhase } from '../../enums.js';
import { type ILayerAssigner } from '../../i-layer-assigner.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

export class HintAwareLayerer implements ILayerAssigner {
  public readonly phase = LayeredPhase.LayerAssignment;

  constructor(private readonly inner: ILayerAssigner) {}

  public execute(context: LayeredContext): void {
    this.inner.execute(context);
    const sameLayerHints = readSameLayerHints(context);
    if (sameLayerHints.length === 0) {
      return;
    }
    applySameLayer(context, sameLayerHints);
  }
}

const readSameLayerHints = (context: LayeredContext): readonly ISameLayerHint[] => {
  const result: ISameLayerHint[] = [];
  for (const hint of getHints(context.graph)) {
    if (hint.kind === HintKind.SameLayer) {
      result.push(hint as ISameLayerHint);
    }
  }
  return result;
};

const applySameLayer = (context: LayeredContext, hints: readonly ISameLayerHint[]): void => {
  const byId = indexById(context);
  for (const hint of hints) {
    mergeLayers(byId.get(hint.nodeAId), byId.get(hint.nodeBId));
  }
  rebuildLayers(context);
};

const indexById = (context: LayeredContext): ReadonlyMap<string, LNode> => {
  const map = new Map<string, LNode>();
  for (const node of context.nodes) {
    if (!node.isRegular()) continue;
    map.set(node.elkNode.id, node);
  }
  return map;
};

const mergeLayers = (a: LNode | undefined, b: LNode | undefined): void => {
  if (a === undefined || b === undefined || a === b) {
    return;
  }
  const target = Math.max(a.layer, b.layer);
  a.setLayer(target);
  b.setLayer(target);
};

const rebuildLayers = (context: LayeredContext): void => {
  const maxLayer = context.nodes.reduce((max, n) => Math.max(max, n.layer), 0);
  const buckets: LNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const node of context.nodes) {
    buckets[node.layer]?.push(node);
  }
  context.assignLayers(buckets);
  for (const layer of context.layers) {
    for (const [index, node] of layer.entries()) {
      node.setIndexInLayer(index);
    }
  }
};
