/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Barnes-Hut repulsion: replaces the exact O(n²) pairwise sum used by the
 * force-directed algorithm with a quadtree walk per node.
 *
 * For each source node, descend the tree:
 *   - skip the leaf that *is* the source itself (no self-repulsion),
 *   - if the region's `size / distance < theta`, apply one Fruchterman-
 *     Reingold-style repulsion from the region's centre of mass scaled
 *     by the region's mass,
 *   - otherwise recurse into the four children.
 *
 * Yields O(n log n) total work and is visually indistinguishable from
 * exact repulsion for `theta ≤ 0.7` on graphs of dozens of nodes — the
 * regime where Barnes-Hut matters.
 */

import { type INode } from '@benkalegin/filigree-graph';

import { buildQuadTree, type IQuadPoint, type QuadTree } from './quadtree.js';

const MIN_DISTANCE = 0.001;

interface IDisplacement {
  x: number;
  y: number;
}

interface IRepulsionParams {
  readonly k: number;
  readonly theta: number;
}

export const applyBarnesHutRepulsion = (
  nodes: readonly INode[],
  displacements: ReadonlyMap<INode, IDisplacement>,
  k: number,
  theta: number,
): void => {
  const points = nodes.map((node, index) => ({
    index,
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }));
  const tree = buildQuadTree(points);
  if (tree === undefined) return;
  const params: IRepulsionParams = { k, theta };
  for (const [i, node] of nodes.entries()) {
    const me = points[i];
    const target = displacements.get(node);
    if (me === undefined || target === undefined) continue;
    const delta = forceFromRegion(tree, me, params);
    target.x += delta.x;
    target.y += delta.y;
  }
};

const forceFromRegion = (
  region: QuadTree,
  source: IQuadPoint,
  params: IRepulsionParams,
): { x: number; y: number } => {
  if (region.mass === 0) return ZERO;
  if (region.point !== undefined) {
    if (region.point.index === source.index) return ZERO;
    return pointRepulsion(source, { x: region.point.x, y: region.point.y, mass: 1 }, params.k);
  }
  const dx = source.x - region.massCenterX;
  const dy = source.y - region.massCenterY;
  const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
  if (region.size / dist < params.theta) {
    return pointRepulsion(
      source,
      { x: region.massCenterX, y: region.massCenterY, mass: region.mass },
      params.k,
    );
  }
  if (region.children === undefined) return ZERO;
  let totalX = 0;
  let totalY = 0;
  for (const child of region.children) {
    const sub = forceFromRegion(child, source, params);
    totalX += sub.x;
    totalY += sub.y;
  }
  return { x: totalX, y: totalY };
};

interface IMassPoint {
  readonly x: number;
  readonly y: number;
  readonly mass: number;
}

const pointRepulsion = (
  source: IQuadPoint,
  other: IMassPoint,
  k: number,
): { x: number; y: number } => {
  const dx = source.x - other.x;
  const dy = source.y - other.y;
  const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
  const force = (k * k * other.mass) / dist;
  return { x: (dx / dist) * force, y: (dy / dist) * force };
};

const ZERO = { x: 0, y: 0 } as const;
