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

import { type IEdge, type INode } from '@benkalegin/filigree-graph';

import { type IFocusHint } from './focus-hint.js';
import { HintKind } from './hint-kind.js';
import { type IHint } from './i-hint.js';
import { type IPinPositionHint } from './pin-position-hint.js';

interface IGraphLike {
  readonly children: readonly INode[];
  readonly containedEdges?: readonly IEdge[];
}

export const applyHints = (graph: IGraphLike, hints: readonly IHint[]): void => {
  if (hints.length === 0) return;
  const byId = indexNodes(graph);
  for (const hint of hints) {
    if (hint.kind === HintKind.PinPosition) {
      applyPinPosition(hint as IPinPositionHint, byId);
    } else if (hint.kind === HintKind.Focus) {
      applyFocus(graph, hint as IFocusHint, byId);
    }
  }
};

const applyPinPosition = (hint: IPinPositionHint, byId: ReadonlyMap<string, INode>): void => {
  const node = byId.get(hint.nodeId);
  if (node === undefined) return;
  node.setPosition(hint.x, hint.y);
};

const applyFocus = (
  graph: IGraphLike,
  hint: IFocusHint,
  byId: ReadonlyMap<string, INode>,
): void => {
  const node = byId.get(hint.nodeId);
  if (node === undefined) return;
  const dx = hint.centerX - (node.x + node.width / 2);
  const dy = hint.centerY - (node.y + node.height / 2);
  if (dx === 0 && dy === 0) return;
  translateNodes(graph.children, dx, dy);
  translateEdges(graph, dx, dy);
};

const translateNodes = (nodes: readonly INode[], dx: number, dy: number): void => {
  for (const node of nodes) {
    node.setPosition(node.x + dx, node.y + dy);
    if (node.children.length > 0) translateNodes(node.children, dx, dy);
  }
};

const translateEdges = (graph: IGraphLike, dx: number, dy: number): void => {
  visitEdges(graph, (edge) => {
    edge.setBendPoints(edge.bendPoints.map((p) => ({ x: p.x + dx, y: p.y + dy })));
  });
};

const visitEdges = (graph: IGraphLike, callback: (edge: IEdge) => void): void => {
  for (const edge of graph.containedEdges ?? []) callback(edge);
  for (const child of graph.children) visitEdges(child, callback);
};

const indexNodes = (graph: IGraphLike): ReadonlyMap<string, INode> => {
  const map = new Map<string, INode>();
  collect(graph.children, map);
  return map;
};

const collect = (nodes: readonly INode[], map: Map<string, INode>): void => {
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children.length > 0) collect(node.children, map);
  }
};
