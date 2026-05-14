/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Deterministic graph generators used by the benchmark suite.
 *
 * Every generator emits an `IJsonGraph` so the same input shape can be
 * fed to any algorithm. Determinism (no `Math.random`) is critical for
 * benchmarks: it lets `vitest bench --run` show stable ms/op figures
 * across machines and makes regressions easy to spot.
 *
 * Sizes use a "T-shirt" naming scheme (small / medium / large) so the
 * bench output reads cleanly without revealing raw node counts in the
 * .bench.ts files.
 */

import { type IJsonGraph } from '@filigree/graph';

const NODE_W = 40;
const NODE_H = 30;

const node = (id: string) => ({ id, width: NODE_W, height: NODE_H });

const seededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xff_ff_ff_ff;
  };
};

// A → B → C → … → N. Long topological chain; layered should produce N
// layers; force should stretch into a line.
export const chain = (n: number): IJsonGraph => {
  const children = Array.from({ length: n }, (_, i) => node(`n${String(i)}`));
  const edges = Array.from({ length: n - 1 }, (_, i) => ({
    id: `e${String(i)}`,
    sources: [`n${String(i)}`],
    targets: [`n${String(i + 1)}`],
  }));
  return { id: 'root', children, edges };
};

const gridIdAt = (r: number, c: number): string => `r${String(r)}c${String(c)}`;

// Rows × cols rectangular DAG: each cell has an edge down and right.
// Stresses layered crossing minimization with many parallel edges.
export const grid = (rows: number, cols: number): IJsonGraph => {
  const children: ReturnType<typeof node>[] = [];
  const edges: { id: string; sources: string[]; targets: string[] }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const here = gridIdAt(r, c);
      children.push(node(here));
      if (r + 1 < rows) {
        edges.push({ id: `${here}-down`, sources: [here], targets: [gridIdAt(r + 1, c)] });
      }
      if (c + 1 < cols) {
        edges.push({ id: `${here}-right`, sources: [here], targets: [gridIdAt(r, c + 1)] });
      }
    }
  }
  return { id: 'root', children, edges };
};

// Balanced k-ary tree of given depth (root + k children + k² grandchildren + …).
// Natural input for mrtree / radial.
export const balancedTree = (branching: number, depth: number): IJsonGraph => {
  const children: ReturnType<typeof node>[] = [];
  const edges: { id: string; sources: string[]; targets: string[] }[] = [];
  let counter = 0;
  const idOf = (): string => `n${String(counter++)}`;
  const build = (parent: string, currentDepth: number): void => {
    if (currentDepth === 0) return;
    for (let i = 0; i < branching; i += 1) {
      const childId = idOf();
      children.push(node(childId));
      edges.push({ id: `${parent}-${childId}`, sources: [parent], targets: [childId] });
      build(childId, currentDepth - 1);
    }
  };
  const rootId = idOf();
  children.push(node(rootId));
  build(rootId, depth);
  return { id: 'root', children, edges };
};

// Pseudo-random DAG with `n` nodes; each edge goes from a lower index to a
// higher one so the result is acyclic by construction. `density` controls
// how many edges are emitted per node attempt (≤ 1 per pair).
export const randomDag = (n: number, density: number, seed = 42): IJsonGraph => {
  const rng = seededRng(seed);
  const children = Array.from({ length: n }, (_, i) => node(`n${String(i)}`));
  const edges: { id: string; sources: string[]; targets: string[] }[] = [];
  let edgeId = 0;
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (rng() < density) {
        edges.push({
          id: `e${String(edgeId++)}`,
          sources: [`n${String(i)}`],
          targets: [`n${String(j)}`],
        });
      }
    }
  }
  return { id: 'root', children, edges };
};

// Undirected mesh: every node connects to `degree` pseudo-random later
// neighbors. Good for stress / force-directed benchmarks.
export const randomMesh = (n: number, degree: number, seed = 42): IJsonGraph => {
  const rng = seededRng(seed);
  const children = Array.from({ length: n }, (_, i) => node(`n${String(i)}`));
  const edges: { id: string; sources: string[]; targets: string[] }[] = [];
  let edgeId = 0;
  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < degree; k += 1) {
      const j = i + 1 + Math.floor(rng() * Math.max(1, n - i - 1));
      if (j < n) {
        edges.push({
          id: `e${String(edgeId++)}`,
          sources: [`n${String(i)}`],
          targets: [`n${String(j)}`],
        });
      }
    }
  }
  return { id: 'root', children, edges };
};

// Edge-free collection of rectangles with varied sizes. Drives rectpacking.
export const cards = (n: number, seed = 42): IJsonGraph => {
  const rng = seededRng(seed);
  const children = Array.from({ length: n }, (_, i) => ({
    id: `c${String(i)}`,
    width: 40 + Math.floor(rng() * 80),
    height: 30 + Math.floor(rng() * 60),
  }));
  return { id: 'root', children };
};

