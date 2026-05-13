/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Decorator that wraps any `ICrossingMinimizer` and applies `OrderBefore`
 * hints after it runs.
 *
 * For each `OrderBefore(a, b)` hint with both nodes in the same layer:
 * if `a.indexInLayer > b.indexInLayer`, swap them. Multiple hints
 * affecting the same layer are applied left-to-right; conflicts (a
 * before b AND b before a) result in the *last* hint winning, which is
 * trivially detectable in test output.
 *
 * Hints that reference unknown ids or cross different layers are
 * silently ignored.
 */

import { getHints, HintKind, type IOrderBeforeHint } from '@filigree/hints';

import { LayeredPhase } from '../../enums.js';
import { type ICrossingMinimizer } from '../../i-crossing-minimizer.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

export class HintAwareCrossingMinimizer implements ICrossingMinimizer {
  public readonly phase = LayeredPhase.CrossingMinimization;

  constructor(private readonly inner: ICrossingMinimizer) {}

  public execute(context: LayeredContext): void {
    this.inner.execute(context);
    const hints = readOrderBeforeHints(context);
    if (hints.length === 0) {
      return;
    }
    applyOrderBefore(context, hints);
  }
}

const readOrderBeforeHints = (context: LayeredContext): readonly IOrderBeforeHint[] => {
  const result: IOrderBeforeHint[] = [];
  for (const hint of getHints(context.graph)) {
    if (hint.kind === HintKind.OrderBefore) {
      result.push(hint as IOrderBeforeHint);
    }
  }
  return result;
};

const applyOrderBefore = (context: LayeredContext, hints: readonly IOrderBeforeHint[]): void => {
  const byId = indexById(context);
  for (const hint of hints) {
    enforce(context, byId.get(hint.nodeAId), byId.get(hint.nodeBId));
  }
};

const indexById = (context: LayeredContext): ReadonlyMap<string, LNode> => {
  const map = new Map<string, LNode>();
  for (const node of context.nodes) {
    map.set(node.elkNode.id, node);
  }
  return map;
};

const enforce = (
  context: LayeredContext,
  a: LNode | undefined,
  b: LNode | undefined,
): void => {
  if (a === undefined || b === undefined || a === b) {
    return;
  }
  if (a.layer !== b.layer) {
    return;
  }
  if (a.indexInLayer < b.indexInLayer) {
    return;
  }
  const layer = context.layers[a.layer];
  if (layer === undefined) {
    return;
  }
  const reordered = [...layer];
  const aIdx = reordered.indexOf(a);
  const bIdx = reordered.indexOf(b);
  reordered[aIdx] = b;
  reordered[bIdx] = a;
  context.reorderLayer(a.layer, reordered);
};
