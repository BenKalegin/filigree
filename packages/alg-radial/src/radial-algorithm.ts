/*******************************************************************************
 * Copyright (c) 2019, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.radial/src/org/eclipse/elk/alg/radial/RadialLayoutProvider.java
 *******************************************************************************/

/**
 * Radial tree layout.
 *
 * Treats the graph as a rooted tree (edges directed from parent to child).
 * The root sits at the origin; each subsequent level lives on a circle of
 * increasing radius. Children of a node are distributed evenly within the
 * angular slice their parent occupies, so a subtree's angular space is
 * proportional to its breadth.
 *
 * Designed for tree-shaped graphs with a single dominant root. Multiple
 * roots are placed angularly around the origin. Cycles are not handled —
 * nodes with multiple incoming edges keep only the first traversal path.
 */

import { type ILayoutAlgorithm, type ILayoutContext } from '@benkalegin/filigree-core';
import { type IEdge, type INode, isNode } from '@benkalegin/filigree-graph';

import { RadialOptions } from './radial-options.js';

export const RADIAL_ALGORITHM_ID = 'radial';
export const RADIAL_DISPLAY_NAME = 'Radial';

const FULL_CIRCLE = Math.PI * 2;

interface IPlacement {
  readonly childrenOf: ReadonlyMap<INode, readonly INode[]>;
  readonly radiusIncrement: number;
}

export class RadialAlgorithm implements ILayoutAlgorithm {
  public readonly id = RADIAL_ALGORITHM_ID;
  public readonly displayName = RADIAL_DISPLAY_NAME;

  public run(context: ILayoutContext): Promise<void> {
    const graph = context.graph;
    const childrenOf = this.buildChildrenMap(graph);
    const roots = this.findRoots(graph, childrenOf);
    const placement: IPlacement = {
      childrenOf,
      radiusIncrement: context.options.resolve(RadialOptions.radiusIncrement, graph),
    };
    this.placeRoots(roots, placement);
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

  private placeRoots(roots: readonly INode[], placement: IPlacement): void {
    if (roots.length === 0) {
      return;
    }
    const sliceWidth = FULL_CIRCLE / roots.length;
    for (const [index, root] of roots.entries()) {
      const start = index * sliceWidth;
      this.placeSubtree(root, 0, { start, end: start + sliceWidth }, placement);
    }
  }

  private placeSubtree(
    node: INode,
    depth: number,
    angle: IAngleRange,
    placement: IPlacement,
  ): void {
    placePolar(node, depth * placement.radiusIncrement, (angle.start + angle.end) / 2);
    const children = placement.childrenOf.get(node) ?? [];
    if (children.length === 0) {
      return;
    }
    const sliceWidth = (angle.end - angle.start) / children.length;
    for (const [index, child] of children.entries()) {
      const childStart = angle.start + index * sliceWidth;
      this.placeSubtree(
        child,
        depth + 1,
        { start: childStart, end: childStart + sliceWidth },
        placement,
      );
    }
  }
}

interface IAngleRange {
  readonly start: number;
  readonly end: number;
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

const placePolar = (node: INode, radius: number, angle: number): void => {
  const cx = radius * Math.cos(angle);
  const cy = radius * Math.sin(angle);
  node.setPosition(cx - node.width / 2, cy - node.height / 2);
};
