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
 */

import { InvalidGraphError, type INode } from '@filigree/graph';
import { type ILayoutContext, type IOptionResolver } from '@filigree/core';

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
  public readonly nodes: readonly LNode[];
  private layerPartition: LNode[][] = [];
  private successors: ReadonlyMap<LNode, readonly LNode[]>;
  private predecessors: ReadonlyMap<LNode, readonly LNode[]>;

  constructor(input: ILayeredContextInput) {
    this.graph = input.base.graph;
    this.options = input.base.options;
    this.nodes = input.nodes;
    this.successors = input.successors;
    this.predecessors = input.predecessors;
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
   * Replaces one layer's contents and re-assigns `indexInLayer` on each node.
   * Crossing minimization calls this once per sweep; doing the index update
   * here keeps the invariant `layers[L][i].indexInLayer === i` in one place.
   */
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
}
