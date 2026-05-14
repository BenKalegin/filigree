/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Walks an `IJsonGraph` and produces concrete `ElkX` instances.
 *
 * Two responsibilities are deliberately co-located here:
 *   - building elements (delegated to `GraphFactory`),
 *   - resolving edge endpoint ids through a parser-local map.
 *
 * The id map is private state of the parser, not a separate `JsonContext`
 * class — externalizing it would only add ceremony, since no other code needs
 * to read it.
 */

import type { ElkEdge } from '../elk-edge.js';
import type { ElkGraph } from '../elk-graph.js';
import type { ElkLabel } from '../elk-label.js';
import type { ElkNode } from '../elk-node.js';
import type { ElkPort } from '../elk-port.js';
import { InvalidGraphError } from '../errors.js';
import { type GraphFactory } from '../graph-factory.js';
import { type IEdgeEndpoint } from '../i-edge.js';
import { toGraphElementId } from '../identity.js';
import { defineProperty } from '../property.js';
import type { PropertyHolder } from '../property-holder.js';
import type {
  IJsonDimensions,
  IJsonEdge,
  IJsonGraph,
  IJsonLabel,
  IJsonNode,
  IJsonPort,
} from './types.js';

export class JsonParser {
  private readonly endpointsById = new Map<string, IEdgeEndpoint>();

  constructor(private readonly factory: GraphFactory) {}

  public parseGraph(json: IJsonGraph): ElkGraph {
    const labels = (json.labels ?? []).map((l) => this.parseLabel(l));
    const ports = (json.ports ?? []).map((p) => this.parsePort(p));
    const children = (json.children ?? []).map((c) => this.parseNode(c));
    const containedEdges = (json.edges ?? []).map((e) => this.parseEdge(e));
    const graph = this.factory.createGraph({
      id: toGraphElementId(json.id),
      labels,
      ports,
      children,
      containedEdges,
      ...this.pickDimensions(json),
    });
    this.applyLayoutOptions(graph, json.layoutOptions);
    this.register(graph.id, graph);
    return graph;
  }

  private parseNode(json: IJsonNode): ElkNode {
    const labels = (json.labels ?? []).map((l) => this.parseLabel(l));
    const ports = (json.ports ?? []).map((p) => this.parsePort(p));
    const children = (json.children ?? []).map((c) => this.parseNode(c));
    const containedEdges = (json.edges ?? []).map((e) => this.parseEdge(e));
    const node = this.factory.createNode({
      id: toGraphElementId(json.id),
      labels,
      ports,
      children,
      containedEdges,
      ...this.pickDimensions(json),
    });
    this.applyLayoutOptions(node, json.layoutOptions);
    this.register(node.id, node);
    return node;
  }

  private parsePort(json: IJsonPort): ElkPort {
    const labels = (json.labels ?? []).map((l) => this.parseLabel(l));
    const port = this.factory.createPort({
      id: toGraphElementId(json.id),
      labels,
      ...this.pickDimensions(json),
    });
    this.applyLayoutOptions(port, json.layoutOptions);
    this.register(port.id, port);
    return port;
  }

  private parseEdge(json: IJsonEdge): ElkEdge {
    const labels = (json.labels ?? []).map((l) => this.parseLabel(l));
    const edge = this.factory.createEdge({
      id: toGraphElementId(json.id),
      sources: json.sources.map((id) => this.resolveEndpoint(id)),
      targets: json.targets.map((id) => this.resolveEndpoint(id)),
      labels,
      bendPoints: json.bendPoints?.map((p) => ({ x: p.x, y: p.y })),
    });
    this.applyLayoutOptions(edge, json.layoutOptions);
    return edge;
  }

  private parseLabel(json: IJsonLabel): ElkLabel {
    const label = this.factory.createLabel({
      id: json.id === undefined ? undefined : toGraphElementId(json.id),
      text: json.text,
      ...this.pickDimensions(json),
    });
    this.applyLayoutOptions(label, json.layoutOptions);
    return label;
  }

  private pickDimensions(json: IJsonDimensions): {
    readonly x: number | undefined;
    readonly y: number | undefined;
    readonly width: number | undefined;
    readonly height: number | undefined;
  } {
    return { x: json.x, y: json.y, width: json.width, height: json.height };
  }

  private applyLayoutOptions(
    holder: PropertyHolder,
    options: Readonly<Record<string, unknown>> | undefined,
  ): void {
    if (options === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(options)) {
      holder.setProperty(defineProperty<unknown>({ id: key, defaultValue: undefined }), value);
    }
  }

  private register(id: string, element: IEdgeEndpoint): void {
    if (this.endpointsById.has(id)) {
      throw new InvalidGraphError(`Duplicate element id: ${id}`);
    }
    this.endpointsById.set(id, element);
  }

  private resolveEndpoint(id: string): IEdgeEndpoint {
    const found = this.endpointsById.get(id);
    if (found === undefined) {
      throw new InvalidGraphError(`Unknown edge endpoint id: ${id}`);
    }
    return found;
  }
}
