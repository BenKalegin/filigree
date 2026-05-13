/**
 * Builds the `LayeredContext` from an `ILayoutContext`.
 *
 * First-cut scope: flat graph only. Children of the root become layered nodes;
 * compound (nested) layouts are deferred to a later iteration. Edge endpoints
 * may be either nodes or ports; ports are resolved to their owning node via a
 * `portId → LNode` map so adjacency is always between layered nodes.
 */

import { type ElkEdge, type ElkNode, type IEdgeEndpoint } from '@filigree/graph';
import { type ILayoutContext } from '@filigree/core';

import { appendUnique } from './adjacency.js';
import { LayeredContext } from './layered-context.js';
import { LNode } from './l-node.js';

export class LayeredContextBuilder {
  public build(base: ILayoutContext): LayeredContext {
    const children = base.graph.children as readonly ElkNode[];
    const nodes = children.map((elkNode) => new LNode(elkNode));
    const lookup = this.buildLookup(nodes);
    const { successors, predecessors } = this.buildAdjacency(
      base.graph.containedEdges as readonly ElkEdge[],
      lookup,
    );
    return new LayeredContext({ base, nodes, successors, predecessors });
  }

  private buildLookup(nodes: readonly LNode[]): IEndpointLookup {
    const byNode = new Map<ElkNode, LNode>();
    const byPortId = new Map<string, LNode>();
    for (const lnode of nodes) {
      byNode.set(lnode.elkNode, lnode);
      for (const port of lnode.elkNode.ports) {
        byPortId.set(port.id, lnode);
      }
    }
    return { byNode, byPortId };
  }

  private buildAdjacency(edges: readonly ElkEdge[], lookup: IEndpointLookup): IAdjacency {
    const successors = new Map<LNode, LNode[]>();
    const predecessors = new Map<LNode, LNode[]>();
    for (const edge of edges) {
      this.addEdgeAdjacency(edge, lookup, successors, predecessors);
    }
    return { successors, predecessors };
  }

  private addEdgeAdjacency(
    edge: ElkEdge,
    lookup: IEndpointLookup,
    successors: Map<LNode, LNode[]>,
    predecessors: Map<LNode, LNode[]>,
  ): void {
    const sources = edge.sources.flatMap((s) => this.resolveEndpoint(s, lookup));
    const targets = edge.targets.flatMap((t) => this.resolveEndpoint(t, lookup));
    for (const source of sources) {
      for (const target of targets) {
        appendUnique(successors, source, target);
        appendUnique(predecessors, target, source);
      }
    }
  }

  private resolveEndpoint(endpoint: IEdgeEndpoint, lookup: IEndpointLookup): LNode[] {
    const asNode = lookup.byNode.get(endpoint as ElkNode);
    if (asNode !== undefined) {
      return [asNode];
    }
    const asPort = lookup.byPortId.get(endpoint.id);
    return asPort === undefined ? [] : [asPort];
  }
}

interface IEndpointLookup {
  readonly byNode: ReadonlyMap<ElkNode, LNode>;
  readonly byPortId: ReadonlyMap<string, LNode>;
}

interface IAdjacency {
  readonly successors: ReadonlyMap<LNode, readonly LNode[]>;
  readonly predecessors: ReadonlyMap<LNode, readonly LNode[]>;
}
