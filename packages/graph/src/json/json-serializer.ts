/**
 * Reverse of `JsonParser`: walks an `ElkGraph` and emits the JSON shape.
 *
 * Round-trip is symmetric: `fromJson(toJson(g))` produces a structurally
 * equivalent graph. Tested with a property test in the json round-trip suite.
 */

import { type ElkEdge } from '../elk-edge.js';
import { type ElkGraph } from '../elk-graph.js';
import { type ElkLabel } from '../elk-label.js';
import { type ElkNode } from '../elk-node.js';
import { type ElkPort } from '../elk-port.js';
import { type PropertyHolder } from '../property-holder.js';
import type { IJsonEdge, IJsonGraph, IJsonLabel, IJsonNode, IJsonPort } from './types.js';

export class JsonSerializer {
  public serializeGraph(graph: ElkGraph): IJsonGraph {
    return this.serializeNode(graph);
  }

  private serializeNode(node: ElkNode): IJsonNode {
    return this.withOptions(node, {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      labels: node.labels.map((l) => this.serializeLabel(l)),
      ports: node.ports.map((p) => this.serializePort(p)),
      children: node.children.map((c) => this.serializeNode(c)),
      edges: node.containedEdges.map((e) => this.serializeEdge(e)),
    });
  }

  private serializePort(port: ElkPort): IJsonPort {
    return this.withOptions(port, {
      id: port.id,
      x: port.x,
      y: port.y,
      width: port.width,
      height: port.height,
      labels: port.labels.map((l) => this.serializeLabel(l)),
    });
  }

  private serializeEdge(edge: ElkEdge): IJsonEdge {
    const base: IJsonEdge = {
      id: edge.id,
      sources: edge.sources.map((s) => s.id),
      targets: edge.targets.map((t) => t.id),
      labels: edge.labels.map((l) => this.serializeLabel(l)),
    };
    const withBends: IJsonEdge =
      edge.bendPoints.length === 0
        ? base
        : { ...base, bendPoints: edge.bendPoints.map((p) => ({ x: p.x, y: p.y })) };
    return this.withOptions(edge, withBends);
  }

  private serializeLabel(label: ElkLabel): IJsonLabel {
    return this.withOptions(label, {
      id: label.id,
      text: label.text,
      x: label.x,
      y: label.y,
      width: label.width,
      height: label.height,
    });
  }

  private withOptions<T extends object>(holder: PropertyHolder, base: T): T {
    const entries = holder.propertyEntries();
    if (entries.length === 0) {
      return base;
    }
    const layoutOptions: Record<string, unknown> = {};
    for (const [id, value] of entries) {
      layoutOptions[id] = value;
    }
    return { ...base, layoutOptions };
  }
}
