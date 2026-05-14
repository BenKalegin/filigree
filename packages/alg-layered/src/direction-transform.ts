/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Coordinate-system rotations that let the TB-only layered pipeline serve
 * `RIGHT`, `LEFT`, and `UP` directions without modifying any phase.
 *
 * Strategy: pre-transpose the input for `RIGHT`/`LEFT` (swap each child's and
 * port's `(width, height)`, swap port `(x, y)`), run the TB pipeline, then
 * un-transpose the output (swap node positions, swap port positions, swap
 * bend points & route segments). For `LEFT` we additionally mirror x across
 * the children's bounding box; for `UP` we mirror y instead.
 *
 * Only the direct children, their ports, and the directly contained edges
 * are touched — nested compounds carry their own coordinate frames and the
 * engine recurses into each one independently.
 */

import { type IEdge, type INode, type IPort } from '@filigree/graph';

export const transposeContainer = (container: INode): void => {
  for (const child of container.children) {
    swapNodeDimensions(child);
    for (const port of child.ports) {
      swapPort(port);
    }
  }
};

export const untransposeContainer = (container: INode): void => {
  for (const child of container.children) {
    swapNodePosition(child);
    swapNodeDimensions(child);
    for (const port of child.ports) {
      swapPort(port);
    }
  }
  for (const edge of container.containedEdges) {
    swapEdgeGeometry(edge);
  }
};

export const flipContainerX = (container: INode): void => {
  if (container.children.length === 0) return;
  const total = childrenXMidpointDouble(container);
  for (const child of container.children) {
    child.setPosition(total - child.x - child.width, child.y);
  }
  for (const edge of container.containedEdges) {
    flipEdgeGeometryX(edge, total);
  }
};

export const flipContainerY = (container: INode): void => {
  if (container.children.length === 0) return;
  const total = childrenYMidpointDouble(container);
  for (const child of container.children) {
    child.setPosition(child.x, total - child.y - child.height);
  }
  for (const edge of container.containedEdges) {
    flipEdgeGeometryY(edge, total);
  }
};

const swapNodeDimensions = (node: INode): void => {
  node.setSize(node.height, node.width);
};

const swapNodePosition = (node: INode): void => {
  node.setPosition(node.y, node.x);
};

const swapPort = (port: IPort): void => {
  port.setPosition(port.y, port.x);
  port.setSize(port.height, port.width);
};

const swapEdgeGeometry = (edge: IEdge): void => {
  edge.setBendPoints(edge.bendPoints.map((p) => ({ x: p.y, y: p.x })));
  if (edge.routeSegments.length > 0) {
    edge.setRouteSegments(edge.routeSegments.map((seg) => seg.map((p) => ({ x: p.y, y: p.x }))));
  }
};

const flipEdgeGeometryX = (edge: IEdge, total: number): void => {
  edge.setBendPoints(edge.bendPoints.map((p) => ({ x: total - p.x, y: p.y })));
  if (edge.routeSegments.length > 0) {
    edge.setRouteSegments(
      edge.routeSegments.map((seg) => seg.map((p) => ({ x: total - p.x, y: p.y }))),
    );
  }
};

const flipEdgeGeometryY = (edge: IEdge, total: number): void => {
  edge.setBendPoints(edge.bendPoints.map((p) => ({ x: p.x, y: total - p.y })));
  if (edge.routeSegments.length > 0) {
    edge.setRouteSegments(
      edge.routeSegments.map((seg) => seg.map((p) => ({ x: p.x, y: total - p.y }))),
    );
  }
};

const childrenXMidpointDouble = (container: INode): number => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const child of container.children) {
    minX = Math.min(minX, child.x);
    maxX = Math.max(maxX, child.x + child.width);
  }
  return minX + maxX;
};

const childrenYMidpointDouble = (container: INode): number => {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const child of container.children) {
    minY = Math.min(minY, child.y);
    maxY = Math.max(maxY, child.y + child.height);
  }
  return minY + maxY;
};
