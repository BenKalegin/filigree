/*******************************************************************************
 * Copyright (c) 2013, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.mrtree/src/org/eclipse/elk/alg/mrtree/TreeLayoutProvider.java
 *******************************************************************************/

/**
 * Mr.Tree — tree layout.
 *
 * Reads the graph's edges as parent → child relationships and walks the
 * resulting forest top-down. For each subtree:
 *   - Leaves are placed left-to-right with `siblingSpacing` between them.
 *   - Internal nodes are centred horizontally over the bounding box of
 *     their direct children.
 *   - Levels are stacked vertically `levelSpacing` apart.
 *
 * Nodes that have no incoming edge are treated as roots; multiple roots
 * lay out their subtrees side-by-side along the top row. Cycles in the
 * input are not handled — this is a tree algorithm. Nodes with multiple
 * incoming edges keep only the first traversal path.
 *
 * Not a full Reingold-Tilford implementation: subtree-overlap correction
 * (the “shift” phase that prevents wide siblings from colliding) is a
 * future iteration. Adequate for moderate trees with comparable-width
 * subtrees.
 */

import { type ILayoutAlgorithm, type ILayoutContext } from '@benkalegin/filigree-core';
import { type IEdge, type INode, isNode } from '@benkalegin/filigree-graph';

import { MrTreeOptions } from './mrtree-options.js';

export const MRTREE_ALGORITHM_ID = 'mrtree';
export const MRTREE_DISPLAY_NAME = 'Mr.Tree';

interface IPlacementContext {
  readonly childrenOf: ReadonlyMap<INode, readonly INode[]>;
  readonly siblingSpacing: number;
  readonly levelSpacing: number;
}

export class MrTreeAlgorithm implements ILayoutAlgorithm {
  public readonly id = MRTREE_ALGORITHM_ID;
  public readonly displayName = MRTREE_DISPLAY_NAME;

  public run(context: ILayoutContext): Promise<void> {
    const graph = context.graph;
    const childrenOf = this.buildChildrenMap(graph);
    const roots = this.findRoots(graph, childrenOf);
    const placement: IPlacementContext = {
      childrenOf,
      siblingSpacing: context.options.resolve(MrTreeOptions.siblingSpacing, graph),
      levelSpacing: context.options.resolve(MrTreeOptions.levelSpacing, graph),
    };
    let cursorX = 0;
    for (const root of roots) {
      cursorX = this.placeSubtree(root, 0, cursorX, placement);
    }
    return Promise.resolve();
  }

  private buildChildrenMap(graph: INode): ReadonlyMap<INode, readonly INode[]> {
    const map = new Map<INode, INode[]>();
    for (const edge of graph.containedEdges) {
      this.addParentChild(edge, map);
    }
    return map;
  }

  private addParentChild(edge: IEdge, map: Map<INode, INode[]>): void {
    const pair = simpleEndpoints(edge);
    if (pair === undefined) {
      return;
    }
    const [source, target] = pair;
    const siblings = map.get(source) ?? [];
    if (!siblings.includes(target)) {
      siblings.push(target);
    }
    map.set(source, siblings);
  }

  private findRoots(
    graph: INode,
    childrenOf: ReadonlyMap<INode, readonly INode[]>,
  ): readonly INode[] {
    const childSet = new Set<INode>();
    for (const list of childrenOf.values()) {
      for (const child of list) {
        childSet.add(child);
      }
    }
    return graph.children.filter((node) => !childSet.has(node));
  }

  private placeSubtree(
    node: INode,
    depth: number,
    cursorX: number,
    placement: IPlacementContext,
  ): number {
    const y = depth * placement.levelSpacing;
    const children = placement.childrenOf.get(node) ?? [];
    if (children.length === 0) {
      node.setPosition(cursorX, y);
      return cursorX + node.width + placement.siblingSpacing;
    }
    let inner = cursorX;
    for (const child of children) {
      inner = this.placeSubtree(child, depth + 1, inner, placement);
    }
    const first = children[0];
    const last = children.at(-1);
    if (first === undefined || last === undefined) {
      // Unreachable — children.length > 0 was checked above.
      node.setPosition(cursorX, y);
      return inner;
    }
    const subtreeCenter = (first.x + (last.x + last.width)) / 2;
    node.setPosition(subtreeCenter - node.width / 2, y);
    return inner;
  }
}

const simpleEndpoints = (edge: IEdge): readonly [INode, INode] | undefined => {
  const [source, ...moreSources] = edge.sources;
  const [target, ...moreTargets] = edge.targets;
  if (source === undefined || target === undefined) {
    return undefined;
  }
  if (moreSources.length > 0 || moreTargets.length > 0) {
    return undefined;
  }
  if (!isNode(source) || !isNode(target)) {
    return undefined;
  }
  return [source, target];
};
