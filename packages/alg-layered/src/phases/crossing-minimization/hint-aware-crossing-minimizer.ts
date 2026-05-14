/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Decorator that wraps any `ICrossingMinimizer` and applies the column-
 * ordering hints (`Group`, `OrderBefore`) after it runs.
 *
 * `Group` first: members are clustered into a contiguous run at their
 * leftmost current index in each layer that holds at least two members.
 * `OrderBefore` second so explicit pair-wise ordering overrides any
 * arrangement chosen by group clustering.
 *
 * Hints that reference unknown ids or cross different layers are
 * silently ignored.
 */

import {
  getHints,
  HintKind,
  type IGroupHint,
  type IOrderBeforeHint,
} from '@benkalegin/filigree-hints';

import { LayeredPhase } from '../../enums.js';
import { type ICrossingMinimizer } from '../../i-crossing-minimizer.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

export class HintAwareCrossingMinimizer implements ICrossingMinimizer {
  public readonly phase = LayeredPhase.CrossingMinimization;

  constructor(private readonly inner: ICrossingMinimizer) {}

  public execute(context: LayeredContext): void {
    this.inner.execute(context);
    const allHints = getHints(context.graph);
    if (allHints.length === 0) return;
    const byId = indexById(context);
    for (const hint of allHints) {
      if (hint.kind === HintKind.Group) applyGroup(context, hint as IGroupHint, byId);
    }
    for (const hint of allHints) {
      if (hint.kind === HintKind.OrderBefore) {
        applyOrderBefore(context, hint as IOrderBeforeHint, byId);
      }
    }
  }
}

const indexById = (context: LayeredContext): ReadonlyMap<string, LNode> => {
  const map = new Map<string, LNode>();
  for (const node of context.nodes) {
    if (!node.isRegular()) continue;
    map.set(node.elkNode.id, node);
  }
  return map;
};

const applyOrderBefore = (
  context: LayeredContext,
  hint: IOrderBeforeHint,
  byId: ReadonlyMap<string, LNode>,
): void => {
  const a = byId.get(hint.nodeAId);
  const b = byId.get(hint.nodeBId);
  if (a === undefined || b === undefined || a === b) return;
  if (a.layer !== b.layer) return;
  if (a.indexInLayer < b.indexInLayer) return;
  const layer = context.layers[a.layer];
  if (layer === undefined) return;
  const reordered = [...layer];
  const aIdx = reordered.indexOf(a);
  const bIdx = reordered.indexOf(b);
  reordered[aIdx] = b;
  reordered[bIdx] = a;
  context.reorderLayer(a.layer, reordered);
};

const applyGroup = (
  context: LayeredContext,
  hint: IGroupHint,
  byId: ReadonlyMap<string, LNode>,
): void => {
  const members = hint.nodeIds
    .map((id) => byId.get(id))
    .filter((n): n is LNode => n !== undefined);
  if (members.length < 2) return;
  const byLayer = new Map<number, LNode[]>();
  for (const member of members) {
    const list = byLayer.get(member.layer) ?? [];
    list.push(member);
    byLayer.set(member.layer, list);
  }
  for (const [layerIndex, layerMembers] of byLayer) {
    if (layerMembers.length < 2) continue;
    clusterInLayer(context, layerIndex, layerMembers);
  }
};

const clusterInLayer = (
  context: LayeredContext,
  layerIndex: number,
  members: readonly LNode[],
): void => {
  const layer = context.layers[layerIndex];
  if (layer === undefined) return;
  const memberSet = new Set(members);
  const memberIndices = members.map((m) => m.indexInLayer);
  const insertAt = Math.min(...memberIndices);
  const others = layer.filter((n) => !memberSet.has(n));
  const orderedMembers = [...members].sort((a, b) => a.indexInLayer - b.indexInLayer);
  const reordered = [
    ...others.slice(0, insertAt),
    ...orderedMembers,
    ...others.slice(insertAt),
  ];
  context.reorderLayer(layerIndex, reordered);
};
