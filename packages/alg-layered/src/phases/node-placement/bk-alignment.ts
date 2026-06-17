/*******************************************************************************
 * Copyright (c) 2012, 2015 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p4nodes/bk/BKNodePlacer.java
 *******************************************************************************/

/**
 * Alignment + compaction passes for the 4-alignment Brandes-Köpf placer.
 *
 * One pass = pick a `(vertical, horizontal)` direction pair and:
 *   1. Build vertical "blocks" — chains of nodes that share an x-coord
 *      because each node aligned with its median neighbor on the adjacent
 *      layer.
 *   2. Compact each block left-to-right to its tightest non-overlapping
 *      x-coordinate, sweeping until no block moves.
 *
 * The placer runs four passes (UP-LEFT, UP-RIGHT, DOWN-LEFT, DOWN-RIGHT)
 * and combines them with a per-node median so individual alignment
 * artifacts cancel out.
 */

import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

const MAX_COMPACTION_ITERATIONS = 16;

export enum HorizontalDirection {
  LeftToRight = 0,
  RightToLeft = 1,
}

export enum VerticalDirection {
  Up = 0,
  Down = 1,
}

export interface IBlockAlignment {
  readonly root: ReadonlyMap<LNode, LNode>;
  readonly align: ReadonlyMap<LNode, LNode>;
}

export const computeAlignmentXs = (
  context: LayeredContext,
  vertical: VerticalDirection,
  horizontal: HorizontalDirection,
  nodeGap: number,
): ReadonlyMap<LNode, number> => {
  const alignment = verticalAlignment(context, vertical, horizontal);
  return compactBlocks(context, alignment, nodeGap, horizontal);
};

interface IAlignmentState {
  readonly root: Map<LNode, LNode>;
  readonly align: Map<LNode, LNode>;
}

interface IAlignmentPass {
  readonly context: LayeredContext;
  readonly vertical: VerticalDirection;
  readonly horizontal: HorizontalDirection;
  readonly state: IAlignmentState;
}

const verticalAlignment = (
  context: LayeredContext,
  vertical: VerticalDirection,
  horizontal: HorizontalDirection,
): IBlockAlignment => {
  const state: IAlignmentState = { root: new Map(), align: new Map() };
  for (const node of context.nodes) {
    state.root.set(node, node);
    state.align.set(node, node);
  }
  const pass: IAlignmentPass = { context, vertical, horizontal, state };
  for (const layerIndex of alignmentLayerOrder(context.layers.length, vertical)) {
    alignLayer(layerIndex, pass);
  }
  return state;
};

const alignmentLayerOrder = (
  layerCount: number,
  vertical: VerticalDirection,
): readonly number[] => {
  if (vertical === VerticalDirection.Up) {
    return Array.from({ length: Math.max(0, layerCount - 1) }, (_, i) => i + 1);
  }
  return Array.from({ length: Math.max(0, layerCount - 1) }, (_, i) => layerCount - 2 - i);
};

const alignLayer = (layerIndex: number, pass: IAlignmentPass): void => {
  const layer = pass.context.layers[layerIndex] ?? [];
  const ordered =
    pass.horizontal === HorizontalDirection.LeftToRight ? layer : [...layer].reverse();
  const cursor = createCursor(pass.horizontal);
  for (const v of ordered) {
    tryAlignNode(v, pass, cursor);
  }
};

const neighborsOf = (v: LNode, pass: IAlignmentPass): readonly LNode[] => {
  const all =
    pass.vertical === VerticalDirection.Up
      ? pass.context.predecessorsOf(v)
      : pass.context.successorsOf(v);
  return [...all].sort((a, b) => a.indexInLayer - b.indexInLayer);
};

const tryAlignNode = (v: LNode, pass: IAlignmentPass, cursor: ICursor): void => {
  const neighbors = neighborsOf(v, pass);
  if (neighbors.length === 0) return;
  for (const u of medianCandidates(neighbors, pass.horizontal)) {
    if (!cursor.accepts(u.indexInLayer)) continue;
    if (pass.state.align.get(u) !== u) continue;
    const rootOfU = pass.state.root.get(u) ?? u;
    pass.state.align.set(u, v);
    pass.state.align.set(v, rootOfU);
    pass.state.root.set(v, rootOfU);
    cursor.consume(u.indexInLayer);
    return;
  }
};

interface ICursor {
  readonly accepts: (index: number) => boolean;
  readonly consume: (index: number) => void;
}

const createCursor = (direction: HorizontalDirection): ICursor => {
  let lastIndex =
    direction === HorizontalDirection.LeftToRight ? -1 : Number.POSITIVE_INFINITY;
  const ltr = direction === HorizontalDirection.LeftToRight;
  return {
    accepts: (index) => (ltr ? index > lastIndex : index < lastIndex),
    consume: (index) => {
      lastIndex = index;
    },
  };
};

const medianCandidates = (
  sortedNeighbors: readonly LNode[],
  horizontal: HorizontalDirection,
): readonly LNode[] => {
  const n = sortedNeighbors.length;
  const lo = Math.floor((n - 1) / 2);
  const hi = Math.ceil((n - 1) / 2);
  const slice = sortedNeighbors.slice(lo, hi + 1);
  return horizontal === HorizontalDirection.LeftToRight ? slice : [...slice].reverse();
};

const compactBlocks = (
  context: LayeredContext,
  alignment: IBlockAlignment,
  nodeGap: number,
  horizontal: HorizontalDirection,
): ReadonlyMap<LNode, number> => {
  // Always start with a left-pack sweep — it tells us where the widest layer
  // ends, which is the anchor a right-pack needs to push toward.
  const leftpack = new Map<LNode, number>();
  for (const node of context.nodes) {
    leftpack.set(alignment.root.get(node) ?? node, 0);
  }
  iterateUntilStable(MAX_COMPACTION_ITERATIONS, () =>
    sweepLeftpack(context, alignment, leftpack, nodeGap),
  );
  if (horizontal === HorizontalDirection.LeftToRight) {
    return expandBlockXs(context, alignment, leftpack);
  }
  // RightToLeft: re-pack each block as far right as it can go without
  // colliding with the right neighbor in any layer. The anchor is the
  // rightmost edge the left-pack sweep needed.
  const rightAnchor = totalWidth(context, alignment, leftpack);
  const rightpack = new Map<LNode, number>();
  for (const root of leftpack.keys()) rightpack.set(root, rightAnchor);
  iterateUntilStable(MAX_COMPACTION_ITERATIONS, () =>
    sweepRightpack(context, alignment, rightpack, { nodeGap, anchor: rightAnchor }),
  );
  return expandBlockXs(context, alignment, rightpack);
};

const iterateUntilStable = (max: number, step: () => boolean): void => {
  for (let i = 0; i < max; i++) {
    if (!step()) return;
  }
};

const sweepLeftpack = (
  context: LayeredContext,
  alignment: IBlockAlignment,
  blockX: Map<LNode, number>,
  nodeGap: number,
): boolean => {
  let changed = false;
  for (const layer of context.layers) {
    let prevRight = 0;
    for (const v of layer) {
      const root = alignment.root.get(v) ?? v;
      const required = Math.max(blockX.get(root) ?? 0, prevRight);
      if (required > (blockX.get(root) ?? 0)) {
        blockX.set(root, required);
        changed = true;
      }
      prevRight = required + v.width + nodeGap;
    }
  }
  return changed;
};

const sweepRightpack = (
  context: LayeredContext,
  alignment: IBlockAlignment,
  blockX: Map<LNode, number>,
  opts: { nodeGap: number; anchor: number },
): boolean => {
  const { nodeGap, anchor } = opts;
  let changed = false;
  for (const layer of context.layers) {
    let nextLeft = anchor;
    for (let i = layer.length - 1; i >= 0; i--) {
      const v = layer[i];
      if (!v) continue;
      const root = alignment.root.get(v) ?? v;
      const maxAllowed = nextLeft - v.width;
      const required = Math.min(blockX.get(root) ?? anchor, maxAllowed);
      if (required < (blockX.get(root) ?? anchor)) {
        blockX.set(root, required);
        changed = true;
      }
      nextLeft = required - nodeGap;
    }
  }
  return changed;
};

const totalWidth = (
  context: LayeredContext,
  alignment: IBlockAlignment,
  blockX: ReadonlyMap<LNode, number>,
): number => {
  let max = 0;
  for (const node of context.nodes) {
    const root = alignment.root.get(node) ?? node;
    const right = (blockX.get(root) ?? 0) + node.width;
    if (right > max) max = right;
  }
  return max;
};

const expandBlockXs = (
  context: LayeredContext,
  alignment: IBlockAlignment,
  blockX: ReadonlyMap<LNode, number>,
): ReadonlyMap<LNode, number> => {
  const result = new Map<LNode, number>();
  for (const node of context.nodes) {
    const root = alignment.root.get(node) ?? node;
    result.set(node, blockX.get(root) ?? 0);
  }
  return result;
};
