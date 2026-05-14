/*******************************************************************************
 * Copyright (c) 2016, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.force/src/org/eclipse/elk/alg/force/stress/StressMajorization.java
 *******************************************************************************/

/**
 * Stress majorization layout.
 *
 * Minimizes the stress functional
 *
 *   stress(X) = Σ_{i<j} w_{ij} (||x_i − x_j|| − d_{ij})²
 *
 * where `d_{ij}` is the graph-theoretic distance (hop count) between
 * nodes `i` and `j`, scaled by the configured `desiredEdgeLength`, and
 * `w_{ij}` = 1 / d_{ij}² so that distant pairs contribute less to the
 * total error. Each iteration applies the standard majorization update
 *
 *   x_i^{new} = (Σ_j w_{ij} (x_j + d_{ij} · (x_i − x_j) / ||x_i − x_j||))
 *               / Σ_j w_{ij}
 *
 * which is guaranteed to decrease the stress. Unconnected components are
 * handled implicitly by clamping infinite hop distances to the diameter
 * of the largest component plus one, so disjoint sub-graphs still settle
 * into separate clusters.
 *
 * Initial placement: deterministic golden-angle spiral around the origin
 * — same shape as the force-directed start, so a seeded user gets a
 * reproducible layout.
 */

import { type ILayoutAlgorithm, type ILayoutContext } from '@benkalegin/filigree-core';
import { type IEdge, type IEdgeEndpoint, type INode, isNode } from '@benkalegin/filigree-graph';

import { StressOptions } from './stress-options.js';

export const STRESS_ALGORITHM_ID = 'stress';
export const STRESS_DISPLAY_NAME = 'Stress majorization';

const GOLDEN_ANGLE_OFFSET = 3;
const GOLDEN_ANGLE_RADICAND = 5;
const SPIRAL_ANGLE_STEP = Math.PI * (GOLDEN_ANGLE_OFFSET - Math.sqrt(GOLDEN_ANGLE_RADICAND));
const MIN_DISTANCE = 0.001;

interface IPosition {
  x: number;
  y: number;
}

interface ISettings {
  readonly desiredEdgeLength: number;
  readonly iterations: number;
}

export class StressAlgorithm implements ILayoutAlgorithm {
  public readonly id = STRESS_ALGORITHM_ID;
  public readonly displayName = STRESS_DISPLAY_NAME;

  public run(context: ILayoutContext): Promise<void> {
    const nodes = context.graph.children;
    if (nodes.length === 0) return Promise.resolve();
    const settings = this.readSettings(context);
    const positions = initialSpiral(nodes.length, settings.desiredEdgeLength);
    const distances = allPairsDistances(nodes, context.graph.containedEdges);
    for (let iter = 0; iter < settings.iterations; iter += 1) {
      stressMajorizationSweep(positions, distances, settings.desiredEdgeLength);
    }
    writeBackPositions(nodes, positions);
    return Promise.resolve();
  }

  private readSettings(context: ILayoutContext): ISettings {
    return {
      desiredEdgeLength: context.options.resolve(
        StressOptions.desiredEdgeLength,
        context.graph,
      ),
      iterations: context.options.resolve(StressOptions.iterations, context.graph),
    };
  }
}

const initialSpiral = (count: number, edgeLength: number): IPosition[] => {
  const out: IPosition[] = [];
  for (let i = 0; i < count; i += 1) {
    const radius = edgeLength * Math.sqrt(i + 1);
    const angle = i * SPIRAL_ANGLE_STEP;
    out.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return out;
};

const allPairsDistances = (
  nodes: readonly INode[],
  edges: readonly IEdge[],
): readonly (readonly number[])[] => {
  const idx = new Map(nodes.map((n, i) => [n, i]));
  const adjacency = buildAdjacency(nodes.length, edges, idx);
  const sources = nodes.map((_, source) => bfsDistances(source, adjacency, nodes.length));
  return clampInfiniteAcross(sources);
};

const buildAdjacency = (
  nodeCount: number,
  edges: readonly IEdge[],
  idx: ReadonlyMap<INode, number>,
): readonly (readonly number[])[] => {
  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const edge of edges) {
    for (const s of edge.sources) {
      for (const t of edge.targets) {
        addEdgeLink(s, t, idx, adjacency);
      }
    }
  }
  return adjacency;
};

const addEdgeLink = (
  source: IEdgeEndpoint,
  target: IEdgeEndpoint,
  idx: ReadonlyMap<INode, number>,
  adjacency: number[][],
): void => {
  const i = nodeIndex(source, idx);
  const j = nodeIndex(target, idx);
  if (i === undefined || j === undefined || i === j) return;
  pushUnique(adjacency[i], j);
  pushUnique(adjacency[j], i);
};

const nodeIndex = (
  endpoint: IEdgeEndpoint,
  idx: ReadonlyMap<INode, number>,
): number | undefined => (isNode(endpoint) ? idx.get(endpoint) : undefined);

const pushUnique = (row: number[] | undefined, value: number): void => {
  if (row === undefined) return;
  if (!row.includes(value)) row.push(value);
};

const bfsDistances = (
  source: number,
  adjacency: readonly (readonly number[])[],
  nodeCount: number,
): number[] => {
  const distances = Array.from({ length: nodeCount }, () => Number.POSITIVE_INFINITY);
  distances[source] = 0;
  const queue: number[] = [source];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    if (current === undefined) continue;
    const currentDistance = distances[current];
    if (currentDistance === undefined) continue;
    for (const neighbor of adjacency[current] ?? []) {
      if (Number.isFinite(distances[neighbor] ?? Number.POSITIVE_INFINITY)) continue;
      distances[neighbor] = currentDistance + 1;
      queue.push(neighbor);
    }
  }
  return distances;
};

const clampInfiniteAcross = (
  matrix: readonly (readonly number[])[],
): readonly (readonly number[])[] => {
  let maxFinite = 0;
  for (const row of matrix) {
    for (const d of row) {
      if (Number.isFinite(d) && d > maxFinite) maxFinite = d;
    }
  }
  const fallback = Math.max(maxFinite, 1) + 1;
  return matrix.map((row) => row.map((d) => (Number.isFinite(d) ? d : fallback)));
};

const stressMajorizationSweep = (
  positions: readonly IPosition[],
  distances: readonly (readonly number[])[],
  edgeLength: number,
): void => {
  for (let i = 0; i < positions.length; i += 1) {
    updateNode(i, positions, distances, edgeLength);
  }
};

const updateNode = (
  i: number,
  positions: readonly IPosition[],
  distances: readonly (readonly number[])[],
  edgeLength: number,
): void => {
  const me = positions[i];
  const myDistances = distances[i];
  if (me === undefined || myDistances === undefined) return;
  let sumX = 0;
  let sumY = 0;
  let sumWeight = 0;
  for (const [j, other] of positions.entries()) {
    const d = j === i ? 0 : (myDistances[j] ?? 0);
    if (d === 0) continue;
    const c = pairContribution(me, other, d, edgeLength);
    sumX += c.dx;
    sumY += c.dy;
    sumWeight += c.weight;
  }
  if (sumWeight === 0) return;
  me.x = sumX / sumWeight;
  me.y = sumY / sumWeight;
};

interface IContribution {
  readonly dx: number;
  readonly dy: number;
  readonly weight: number;
}

const pairContribution = (
  me: IPosition,
  other: IPosition,
  d: number,
  edgeLength: number,
): IContribution => {
  const dx = me.x - other.x;
  const dy = me.y - other.y;
  const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
  const target = edgeLength * d;
  const weight = 1 / (d * d);
  return {
    dx: weight * (other.x + (target * dx) / dist),
    dy: weight * (other.y + (target * dy) / dist),
    weight,
  };
};

const writeBackPositions = (
  nodes: readonly INode[],
  positions: readonly IPosition[],
): void => {
  for (const [i, node] of nodes.entries()) {
    const p = positions[i];
    if (p === undefined) continue;
    node.setPosition(p.x - node.width / 2, p.y - node.height / 2);
  }
};
