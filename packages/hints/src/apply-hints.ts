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

// HintKind currently has a single member, so this comparison is always true
// at the type level. Adding a second kind activates real discrimination
// without changing the predicate's call sites.
const isPinPositionHint = (hint: IHint): hint is IPinPositionHint =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- placeholder until a second HintKind lands
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
