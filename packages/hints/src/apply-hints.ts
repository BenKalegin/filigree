/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Entry point: apply a list of hints to a laid-out graph.
 *
 * Dispatches per-hint to the appropriate applicator. Hints that reference
 * a missing node id are silently ignored — they may target a sub-graph
 * that wasn't included in this layout pass, and aborting would be
 * surprising for the typical use case.
 */

import { type INode } from '@filigree/graph';

import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';
import { type IPinPositionHint } from './pin-position-hint.js';

export const applyHints = (
  graph: { readonly children: readonly INode[] },
  hints: readonly IHint[],
): void => {
  if (hints.length === 0) {
    return;
  }
  const byId = indexNodes(graph);
  for (const hint of hints) {
    if (isPinPositionHint(hint)) {
      applyPinPosition(hint, byId);
    }
  }
};

const isPinPositionHint = (hint: IHint): hint is IPinPositionHint =>
  hint.kind === HintKind.PinPosition;

const applyPinPosition = (hint: IPinPositionHint, byId: ReadonlyMap<string, INode>): void => {
  const node = byId.get(hint.nodeId);
  if (node === undefined) {
    return;
  }
  node.setPosition(hint.x, hint.y);
};

const indexNodes = (graph: { readonly children: readonly INode[] }): ReadonlyMap<string, INode> => {
  const map = new Map<string, INode>();
  collect(graph.children, map);
  return map;
};

const collect = (nodes: readonly INode[], map: Map<string, INode>): void => {
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children.length > 0) {
      collect(node.children, map);
    }
  }
};
