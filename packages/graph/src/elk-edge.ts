/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Concrete edge.
 *
 * Endpoints are direct object references — there is no separate id-resolution
 * pass when an edge is constructed in code. JSON loading is the only path that
 * resolves ids to references, and it does so before any edge is built.
 */

import { type IPoint } from './coordinates.js';
import { type GraphElementId } from './identity.js';
import { type IEdge, type IEdgeEndpoint } from './i-edge.js';
import { type ElkLabel } from './elk-label.js';
import { PropertyHolder } from './property-holder.js';

export interface IElkEdgeInput {
  readonly id: GraphElementId;
  readonly sources: readonly IEdgeEndpoint[];
  readonly targets: readonly IEdgeEndpoint[];
  readonly labels?: readonly ElkLabel[] | undefined;
  readonly bendPoints?: readonly IPoint[] | undefined;
}

export class ElkEdge extends PropertyHolder implements IEdge {
  public readonly id: GraphElementId;
  public readonly sources: readonly IEdgeEndpoint[];
  public readonly targets: readonly IEdgeEndpoint[];
  public readonly labels: readonly ElkLabel[];
  public bendPoints: readonly IPoint[];
  public routeSegments: readonly (readonly IPoint[])[] = [];

  constructor(input: IElkEdgeInput) {
    super();
    this.id = input.id;
    this.sources = input.sources;
    this.targets = input.targets;
    this.labels = input.labels ?? [];
    this.bendPoints = input.bendPoints ?? [];
  }

  public setBendPoints(points: readonly IPoint[]): void {
    this.bendPoints = points;
  }

  public setRouteSegments(segments: readonly (readonly IPoint[])[]): void {
    this.routeSegments = segments;
  }
}
