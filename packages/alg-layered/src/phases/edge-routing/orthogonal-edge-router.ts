/*******************************************************************************
 * Copyright (c) 2010, 2020 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p5edges/OrthogonalEdgeRouter.java
 *******************************************************************************/

/**
 * Two-bend orthogonal edge router with parallel-edge awareness and dummy-
 * node threading for long edges.
 *
 * For each simple edge (one source, one target), routes:
 *
 *   source-anchor → (sx, midY) → (tx, midY) → target-anchor
 *
 * Anchors come from `endpointAnchor` in @filigree/graph: node endpoints anchor
 * at their top/bottom-center, port endpoints anchor at the port's absolute
 * center. Same-column anchors normally need no bends and produce a straight
 * vertical edge.
 *
 * Parallel edges — multiple edges between the same unordered pair of nodes,
 * typically a forward edge and its back edge — share the same column and
 * would overlap into one visual line. The router groups edges by endpoint
 * pair, assigns each a lateral offset, and emits a 4-bend C-route for any
 * non-zero-offset same-column edge so each member of the pair takes a
 * distinct visual path.
 *
 * Long edges — edges spanning more than one layer — get a dummy chain from
 * `LongEdgeSplitter`. When a chain exists for an edge, the router threads
 * the polyline through each dummy's position; otherwise the simple two-bend
 * route applies.
 *
 * Hyperedges are skipped — they would need a Steiner-tree style router.
 */

import {
  EdgeAnchorSide,
  endpointAnchor,
  type IEdge,
  type IEdgeEndpoint,
  type INode,
  type IPoint,
  isNode,
} from '@filigree/graph';

import { LayeredPhase } from '../../enums.js';
import { type IEdgeRouter } from '../../i-edge-router.js';
import { LayeredOptions } from '../../layered-options.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { bendsBetween, bendsThroughWaypoints } from './orthogonal-bends.js';

export class OrthogonalEdgeRouter implements IEdgeRouter {
  public readonly phase = LayeredPhase.EdgeRouting;

  public execute(context: LayeredContext): void {
    const portToNode = this.buildPortMap(context.graph);
    const offsets = this.assignParallelOffsets(context, portToNode);
    for (const edge of context.graph.containedEdges) {
      this.routeEdge(context, edge, portToNode, offsets.get(edge) ?? 0);
    }
  }

  private buildPortMap(container: INode): ReadonlyMap<string, INode> {
    const map = new Map<string, INode>();
    for (const child of container.children) {
      for (const port of child.ports) {
        map.set(port.id, child);
      }
    }
    return map;
  }

  /**
   * Group edges by unordered endpoint pair and assign each a signed lateral
   * offset around 0. The single-edge case stays at 0 (no detour). A
   * forward + back pair gets `[0, +offset]`; longer parallel runs alternate
   * outward `[0, +δ, -δ, +2δ, -2δ, …]`.
   */
  private assignParallelOffsets(
    context: LayeredContext,
    portToNode: ReadonlyMap<string, INode>,
  ): ReadonlyMap<IEdge, number> {
    const offsetStep = context.options.resolve(LayeredOptions.parallelEdgeOffset, context.graph);
    const groups = new Map<string, IEdge[]>();
    for (const edge of context.graph.containedEdges) {
      const key = this.pairKey(edge, portToNode);
      if (key === undefined) continue;
      const list = groups.get(key) ?? [];
      list.push(edge);
      groups.set(key, list);
    }
    const offsets = new Map<IEdge, number>();
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      for (const [index, edge] of list.entries()) {
        offsets.set(edge, signedOffsetForIndex(index, offsetStep));
      }
    }
    return offsets;
  }

  private pairKey(edge: IEdge, portToNode: ReadonlyMap<string, INode>): string | undefined {
    const resolved = this.resolveSimpleEdge(edge, portToNode);
    if (resolved === undefined) return undefined;
    const ids = [resolved.sourceOwner.id, resolved.targetOwner.id].sort();
    return ids.join('|');
  }

  private routeEdge(
    context: LayeredContext,
    edge: IEdge,
    portToNode: ReadonlyMap<string, INode>,
    lateralOffset: number,
  ): void {
    const resolved = this.resolveSimpleEdge(edge, portToNode);
    if (resolved === undefined) return;
    const goingDown = resolved.sourceOwner.y <= resolved.targetOwner.y;
    const sourceSide = goingDown ? EdgeAnchorSide.Bottom : EdgeAnchorSide.Top;
    const targetSide = goingDown ? EdgeAnchorSide.Top : EdgeAnchorSide.Bottom;
    const start = endpointAnchor(resolved.sourceEndpoint, resolved.sourceOwner, sourceSide);
    const end = endpointAnchor(resolved.targetEndpoint, resolved.targetOwner, targetSide);
    const dummies = context.dummyChainFor(edge);
    if (dummies !== undefined && dummies.length > 0) {
      const waypoints: readonly IPoint[] = dummies.map((d) => ({ x: d.x, y: d.y }));
      edge.setBendPoints(bendsThroughWaypoints(start, waypoints, end));
      return;
    }
    edge.setBendPoints(bendsBetween(start, end, lateralOffset));
  }

  private resolveSimpleEdge(
    edge: IEdge,
    portToNode: ReadonlyMap<string, INode>,
  ): IResolvedEdge | undefined {
    const [sourceEndpoint, ...moreSources] = edge.sources;
    const [targetEndpoint, ...moreTargets] = edge.targets;
    if (sourceEndpoint === undefined || targetEndpoint === undefined) return undefined;
    if (moreSources.length > 0 || moreTargets.length > 0) return undefined;
    const sourceOwner = this.resolveOwningNode(sourceEndpoint, portToNode);
    const targetOwner = this.resolveOwningNode(targetEndpoint, portToNode);
    if (sourceOwner === undefined || targetOwner === undefined) return undefined;
    return { sourceEndpoint, sourceOwner, targetEndpoint, targetOwner };
  }

  private resolveOwningNode(
    endpoint: IEdgeEndpoint,
    portToNode: ReadonlyMap<string, INode>,
  ): INode | undefined {
    if (isNode(endpoint)) return endpoint;
    return portToNode.get(endpoint.id);
  }
}

interface IResolvedEdge {
  readonly sourceEndpoint: IEdgeEndpoint;
  readonly sourceOwner: INode;
  readonly targetEndpoint: IEdgeEndpoint;
  readonly targetOwner: INode;
}

const signedOffsetForIndex = (index: number, step: number): number => {
  if (index === 0) return 0;
  const rank = Math.floor((index + 1) / 2);
  const sign = index % 2 === 1 ? 1 : -1;
  return sign * rank * step;
};
