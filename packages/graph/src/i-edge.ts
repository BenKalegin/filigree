/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Directed edge between two graph elements.
 *
 * ELK supports hyperedges (multiple sources, multiple targets) and edges that
 * connect to ports rather than nodes; sources and targets are therefore lists
 * of either nodes or ports.
 */

import { type IPoint } from './coordinates.js';
import { type IGraphElement } from './i-graph-element.js';
import { type ILabel } from './i-label.js';
import { type INode } from './i-node.js';
import { type IPort } from './i-port.js';

export type IEdgeEndpoint = INode | IPort;

export interface IEdge extends IGraphElement {
  readonly sources: readonly IEdgeEndpoint[];
  readonly targets: readonly IEdgeEndpoint[];
  readonly labels: readonly ILabel[];
  /**
   * Inflection points of the edge's polyline, in order from source to target.
   * The endpoint anchors (where the line touches the source/target box) are
   * not stored here — renderers derive them from node geometry. A straight
   * edge has `bendPoints = []`.
   */
  readonly bendPoints: readonly IPoint[];
  /**
   * For hyperedges (multiple sources or multiple targets), the router emits
   * one polyline per endpoint-to-junction branch instead of a single
   * source-to-target polyline. Each segment is a self-contained list of
   * points the renderer draws as its own polyline. Empty for simple
   * one-source-one-target edges, which use `bendPoints` instead.
   */
  readonly routeSegments: readonly (readonly IPoint[])[];

  setBendPoints(points: readonly IPoint[]): void;
  setRouteSegments(segments: readonly (readonly IPoint[])[]): void;
}
