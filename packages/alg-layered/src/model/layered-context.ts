/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Phase-internal state for one run of the layered algorithm.
 *
 * Wraps the user-visible `ILayoutContext` (graph + options) with the
 * intermediate structures phases mutate: a flat list of `LNode`s, the layer
 * partition, and adjacency. The class hands mutation power out via methods
 * so phases don't reach into private maps directly.
 *
 * Long-edge handling: `LongEdgeSplitter` inserts dummy `LNode`s for edges
 * spanning multiple layers and records the dummy chain under the original
 * edge. The edge router reads those chains to lay the original edge through
 * the dummy positions.
 */

import { type IEdge, InvalidGraphError, type INode } from '@benkalegin/filigree-graph';
import { type ILayoutContext, type IOptionResolver } from '@benkalegin/filigree-core';

import { type LNode } from './l-node.js';

export interface ILayeredContextInput {
  readonly base: ILayoutContext;
  readonly nodes: readonly LNode[];
  readonly successors: ReadonlyMap<LNode, readonly LNode[]>;
  readonly predecessors: ReadonlyMap<LNode, readonly LNode[]>;
}

export class LayeredContext {
  public readonly graph: INode;
  public readonly options: IOptionResolver;
  private readonly mutableNodes: LNode[];
  private layerPartition: LNode[][] = [];
  private successors: ReadonlyMap<LNode, readonly LNode[]>;
  private predecessors: ReadonlyMap<LNode, readonly LNode[]>;
  private readonly longEdges = new Map<IEdge, readonly LNode[]>();

  constructor(input: ILayeredContextInput) {
    this.graph = input.base.graph;
    this.options = input.base.options;
    this.mutableNodes = [...input.nodes];
    this.successors = input.successors;
    this.predecessors = input.predecessors;
  }

  public get nodes(): readonly LNode[] {
    return this.mutableNodes;
  }

  public get layers(): readonly (readonly LNode[])[] {
    return this.layerPartition;
  }

  public successorsOf(node: LNode): readonly LNode[] {
    return this.successors.get(node) ?? [];
  }

  public predecessorsOf(node: LNode): readonly LNode[] {
    return this.predecessors.get(node) ?? [];
  }

  public assignLayers(partition: readonly (readonly LNode[])[]): void {
    this.layerPartition = partition.map((layer) => [...layer]);
  }

  /**
   * Replace the successor/predecessor adjacency wholesale.
   * Cycle breaking uses this after computing a reversed adjacency.
   */
  public replaceAdjacency(
    successors: ReadonlyMap<LNode, readonly LNode[]>,
    predecessors: ReadonlyMap<LNode, readonly LNode[]>,
  ): void {
    this.successors = successors;
    this.predecessors = predecessors;
  }

  /**
   * Replaces one layer's contents and re-assigns `indexInLayer` on each node.
   * Crossing minimization calls this once per sweep; doing the index update
   * here keeps the invariant `layers[L][i].indexInLayer === i` in one place.
   */
  public reorderLayer(layerIndex: number, newOrder: readonly LNode[]): void {
    if (layerIndex < 0 || layerIndex >= this.layerPartition.length) {
      throw new InvalidGraphError(
        `Layer index out of bounds: ${String(layerIndex)} (have ${String(this.layerPartition.length)})`,
      );
    }
    this.layerPartition[layerIndex] = [...newOrder];
    for (const [idx, node] of newOrder.entries()) {
      node.setIndexInLayer(idx);
    }
  }

  /**
   * Register a dummy chain for a long edge plus the post-split adjacency.
   * `LongEdgeSplitter` calls this once for every multi-layer edge so the
   * edge router can later read positions off the dummies.
   */
  public registerLongEdge(
    edge: IEdge,
    dummies: readonly LNode[],
    successors: ReadonlyMap<LNode, readonly LNode[]>,
    predecessors: ReadonlyMap<LNode, readonly LNode[]>,
  ): void {
    this.longEdges.set(edge, dummies);
    this.mutableNodes.push(...dummies);
    this.successors = successors;
    this.predecessors = predecessors;
  }

  public dummyChainFor(edge: IEdge): readonly LNode[] | undefined {
    return this.longEdges.get(edge);
  }
}
