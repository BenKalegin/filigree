/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Inserts a chain of dummy `LNode`s for every edge that spans more than one
 * layer. The chain runs through each intermediate layer so:
 *
 *   - crossing minimization sees the long edge as a series of short edges
 *     (proper barycenters require this);
 *   - node placement positions each dummy like a regular node, giving the
 *     edge router waypoints to thread the original edge through.
 *
 * Parallel edges between the same `(source, target)` pair share a single
 * dummy chain — each `IEdge` is registered against the same dummies and
 * routes through them.
 *
 * Hyperedges (multiple sources or targets) are skipped; the router skips
 * them too.
 */

import { type ElkNode, type IEdge, type IEdgeEndpoint } from '@filigree/graph';

import { type ILongEdgeProcessor } from '../../i-long-edge-processor.js';
import { appendUnique } from '../../model/adjacency.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { LNode } from '../../model/l-node.js';

interface IMutableAdjacency {
  readonly successors: Map<LNode, LNode[]>;
  readonly predecessors: Map<LNode, LNode[]>;
}

interface ILookup {
  readonly byNode: ReadonlyMap<ElkNode, LNode>;
  readonly byPortId: ReadonlyMap<string, LNode>;
}

interface ISplitState {
  readonly context: LayeredContext;
  readonly lookup: ILookup;
  readonly adjacency: IMutableAdjacency;
  readonly layers: LNode[][];
  readonly chainsByPair: Map<string, readonly LNode[]>;
}

export class DummyLongEdgeProcessor implements ILongEdgeProcessor {
  public process(context: LayeredContext): void {
    const state: ISplitState = {
      context,
      lookup: buildLookup(context),
      adjacency: mutableAdjacency(context),
      layers: mutableLayers(context),
      chainsByPair: new Map(),
    };
    for (const edge of context.graph.containedEdges) {
      handleEdge(state, edge);
    }
    rebuildIndexInLayer(state.layers);
    context.assignLayers(state.layers);
    context.replaceAdjacency(state.adjacency.successors, state.adjacency.predecessors);
  }
}

const buildLookup = (context: LayeredContext): ILookup => {
  const byNode = new Map<ElkNode, LNode>();
  const byPortId = new Map<string, LNode>();
  for (const node of context.nodes) {
    if (!node.isRegular()) continue;
    byNode.set(node.elkNode, node);
    for (const port of node.elkNode.ports) {
      byPortId.set(port.id, node);
    }
  }
  return { byNode, byPortId };
};

const mutableAdjacency = (context: LayeredContext): IMutableAdjacency => {
  const successors = new Map<LNode, LNode[]>();
  const predecessors = new Map<LNode, LNode[]>();
  for (const node of context.nodes) {
    successors.set(node, [...context.successorsOf(node)]);
    predecessors.set(node, [...context.predecessorsOf(node)]);
  }
  return { successors, predecessors };
};

const mutableLayers = (context: LayeredContext): LNode[][] =>
  context.layers.map((layer) => [...layer]);

const handleEdge = (state: ISplitState, edge: IEdge): void => {
  const resolved = resolveSimpleEndpoints(edge, state.lookup);
  if (resolved === undefined) return;
  const { source, target } = resolved;
  const span = target.layer - source.layer;
  if (span <= 1) return;
  const key = `${source.elkNode.id}→${target.elkNode.id}`;
  const existing = state.chainsByPair.get(key);
  if (existing !== undefined) {
    state.context.registerLongEdge(
      edge,
      existing,
      state.adjacency.successors,
      state.adjacency.predecessors,
    );
    return;
  }
  const chain = buildDummyChain(source.layer, target.layer);
  insertChainIntoLayers(chain, state.layers);
  rewireAdjacency(source, target, chain, state.adjacency);
  state.chainsByPair.set(key, chain);
  state.context.registerLongEdge(
    edge,
    chain,
    state.adjacency.successors,
    state.adjacency.predecessors,
  );
};

const resolveSimpleEndpoints = (
  edge: IEdge,
  lookup: ILookup,
): { source: LNode; target: LNode } | undefined => {
  const source = singleEndpoint(edge.sources, lookup);
  const target = singleEndpoint(edge.targets, lookup);
  if (source === undefined || target === undefined || source === target) return undefined;
  if (!source.hasLayerAssigned() || !target.hasLayerAssigned()) return undefined;
  return { source, target };
};

const singleEndpoint = (
  endpoints: readonly IEdgeEndpoint[],
  lookup: ILookup,
): LNode | undefined => {
  if (endpoints.length !== 1) return undefined;
  const [endpoint] = endpoints;
  return endpoint === undefined ? undefined : ownerOf(endpoint, lookup);
};

const ownerOf = (endpoint: IEdgeEndpoint, lookup: ILookup): LNode | undefined => {
  const asNode = lookup.byNode.get(endpoint as ElkNode);
  if (asNode !== undefined) return asNode;
  return lookup.byPortId.get(endpoint.id);
};

const buildDummyChain = (sourceLayer: number, targetLayer: number): readonly LNode[] => {
  const chain: LNode[] = [];
  for (let layer = sourceLayer + 1; layer < targetLayer; layer += 1) {
    const dummy = LNode.dummy();
    dummy.setLayer(layer);
    chain.push(dummy);
  }
  return chain;
};

const insertChainIntoLayers = (chain: readonly LNode[], layers: LNode[][]): void => {
  for (const dummy of chain) {
    let layer = layers[dummy.layer];
    if (layer === undefined) {
      while (layers.length <= dummy.layer) layers.push([]);
      layer = layers[dummy.layer] ?? [];
    }
    layer.push(dummy);
  }
};

const rewireAdjacency = (
  source: LNode,
  target: LNode,
  chain: readonly LNode[],
  adjacency: IMutableAdjacency,
): void => {
  removeFromList(adjacency.successors.get(source), target);
  removeFromList(adjacency.predecessors.get(target), source);
  let prev: LNode = source;
  for (const dummy of chain) {
    appendUnique(adjacency.successors, prev, dummy);
    appendUnique(adjacency.predecessors, dummy, prev);
    prev = dummy;
  }
  appendUnique(adjacency.successors, prev, target);
  appendUnique(adjacency.predecessors, target, prev);
};

const removeFromList = (list: LNode[] | undefined, item: LNode): void => {
  if (list === undefined) return;
  const idx = list.indexOf(item);
  if (idx !== -1) list.splice(idx, 1);
};

const rebuildIndexInLayer = (layers: readonly LNode[][]): void => {
  for (const layer of layers) {
    for (const [idx, node] of layer.entries()) {
      node.setIndexInLayer(idx);
    }
  }
};
