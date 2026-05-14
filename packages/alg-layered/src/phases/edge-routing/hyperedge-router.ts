/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Junction-style orthogonal routing for hyperedges.
 *
 * A hyperedge has more than one source or more than one target. Drawing
 * it as a single polyline would be misleading, so we split the edge into
 * one polyline per branch all meeting at a shared junction:
 *
 *     s1   s2
 *      \   /
 *       \ /
 *        ●  <- junction
 *       / \
 *      /   \
 *     t1   t2
 *
 * Each branch is a 2-bend orthogonal path from the endpoint anchor to
 * the junction. The branches are written onto the edge via
 * `setRouteSegments` so the renderer can draw each as its own polyline.
 *
 * Hyperedges with all endpoints on a single layer are punted (no clean
 * "junction y" exists). The router treats them as unroutable, matching
 * the existing behavior for any edge `resolveSimpleEdge` doesn't accept.
 */

import {
  EdgeAnchorSide,
  endpointAnchor,
  type IEdge,
  type IEdgeEndpoint,
  type INode,
  type IPoint,
  isNode,
} from '@benkalegin/filigree-graph';

interface IResolvedEndpoint {
  readonly endpoint: IEdgeEndpoint;
  readonly owner: INode;
}

export const routeHyperedge = (
  edge: IEdge,
  portToNode: ReadonlyMap<string, INode>,
): boolean => {
  const sources = resolveAll(edge.sources, portToNode);
  const targets = resolveAll(edge.targets, portToNode);
  if (sources.length === 0 || targets.length === 0) return false;
  if (sources.length < 2 && targets.length < 2) return false;
  const sourceBottom = Math.max(...sources.map((s) => s.owner.y + s.owner.height));
  const targetTop = Math.min(...targets.map((t) => t.owner.y));
  if (sourceBottom >= targetTop) return false; // overlapping layers — skip
  const junctionY = (sourceBottom + targetTop) / 2;
  const allXs = [...sources, ...targets].map((e) => e.owner.x + e.owner.width / 2);
  const junctionX = allXs.reduce((sum, x) => sum + x, 0) / allXs.length;
  const segments = [
    ...sources.map((s) => sourceBranch(s, junctionX, junctionY)),
    ...targets.map((t) => targetBranch(t, junctionX, junctionY)),
  ];
  edge.setRouteSegments(segments);
  edge.setBendPoints([]);
  return true;
};

const resolveAll = (
  endpoints: readonly IEdgeEndpoint[],
  portToNode: ReadonlyMap<string, INode>,
): readonly IResolvedEndpoint[] => {
  const out: IResolvedEndpoint[] = [];
  for (const endpoint of endpoints) {
    const owner = ownerOf(endpoint, portToNode);
    if (owner !== undefined) out.push({ endpoint, owner });
  }
  return out;
};

const ownerOf = (
  endpoint: IEdgeEndpoint,
  portToNode: ReadonlyMap<string, INode>,
): INode | undefined => {
  if (isNode(endpoint)) return endpoint;
  return portToNode.get(endpoint.id);
};

const sourceBranch = (
  source: IResolvedEndpoint,
  junctionX: number,
  junctionY: number,
): readonly IPoint[] => {
  const anchor = endpointAnchor(source.endpoint, source.owner, EdgeAnchorSide.Bottom);
  return [anchor, { x: anchor.x, y: junctionY }, { x: junctionX, y: junctionY }];
};

const targetBranch = (
  target: IResolvedEndpoint,
  junctionX: number,
  junctionY: number,
): readonly IPoint[] => {
  const anchor = endpointAnchor(target.endpoint, target.owner, EdgeAnchorSide.Top);
  return [{ x: junctionX, y: junctionY }, { x: anchor.x, y: junctionY }, anchor];
};
