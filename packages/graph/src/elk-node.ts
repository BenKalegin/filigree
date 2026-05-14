/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Concrete node — both atomic nodes and compound (sub-graph-bearing) nodes.
 *
 * Children, ports, labels, and contained edges are passed in at construction;
 * mutating these collections after construction is intentionally not exposed.
 * That keeps the topology stable while the layout engine writes coordinates.
 */

import { NodeKind } from './enums.js';
import { type GraphElementId } from './identity.js';
import { type INode } from './i-node.js';
import { type ElkEdge } from './elk-edge.js';
import { type ElkLabel } from './elk-label.js';
import { type ElkPort } from './elk-port.js';
import { PropertyHolder } from './property-holder.js';

export interface IElkNodeInput {
  readonly id: GraphElementId;
  readonly kind?: NodeKind | undefined;
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly labels?: readonly ElkLabel[] | undefined;
  readonly ports?: readonly ElkPort[] | undefined;
  readonly children?: readonly ElkNode[] | undefined;
  readonly containedEdges?: readonly ElkEdge[] | undefined;
}

export class ElkNode extends PropertyHolder implements INode {
  public readonly id: GraphElementId;
  public readonly kind: NodeKind;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public readonly labels: readonly ElkLabel[];
  public readonly ports: readonly ElkPort[];
  public readonly children: readonly ElkNode[];
  public readonly containedEdges: readonly ElkEdge[];
  public parent: ElkNode | null = null;

  constructor(input: IElkNodeInput) {
    super();
    const layout = ElkNode.normalizeLayout(input);
    const topology = ElkNode.normalizeTopology(input);
    this.id = input.id;
    this.kind = input.kind ?? ElkNode.deriveKind(topology.children);
    this.x = layout.x;
    this.y = layout.y;
    this.width = layout.width;
    this.height = layout.height;
    this.labels = topology.labels;
    this.ports = topology.ports;
    this.children = topology.children;
    this.containedEdges = topology.containedEdges;
    for (const child of this.children) {
      child.setParent(this);
    }
  }

  public setParent(parent: ElkNode | null): void {
    this.parent = parent;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  private static normalizeLayout(input: IElkNodeInput): {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } {
    return {
      x: input.x ?? 0,
      y: input.y ?? 0,
      width: input.width ?? 0,
      height: input.height ?? 0,
    };
  }

  private static normalizeTopology(input: IElkNodeInput): {
    readonly labels: readonly ElkLabel[];
    readonly ports: readonly ElkPort[];
    readonly children: readonly ElkNode[];
    readonly containedEdges: readonly ElkEdge[];
  } {
    return {
      labels: input.labels ?? [],
      ports: input.ports ?? [],
      children: input.children ?? [],
      containedEdges: input.containedEdges ?? [],
    };
  }

  private static deriveKind(children: readonly ElkNode[]): NodeKind {
    return children.length > 0 ? NodeKind.Compound : NodeKind.Atomic;
  }
}
