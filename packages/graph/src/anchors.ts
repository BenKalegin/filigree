/**
 * Where an edge attaches to an endpoint.
 *
 * For **node endpoints**: the anchor sits on the requested side of the node's
 * bounding box — at the center of the top edge for `Top`, the center of the
 * bottom edge for `Bottom`. The caller (router or renderer) picks the side
 * based on the relative position of the two endpoints: a back edge (source
 * below target) anchors at the source's top and the target's bottom so the
 * routed line stays in the gap between them instead of cutting through a
 * node body.
 *
 * For **port endpoints**: the anchor is the port's absolute center,
 * independent of the requested side — ports are already positioned where the
 * edge should attach. (Port-side-aware anchoring is a future iteration.)
 */

import { type IPoint } from './coordinates.js';
import { type IEdgeEndpoint } from './i-edge.js';
import { type INode } from './i-node.js';
import { isPort } from './type-guards.js';

export enum EdgeAnchorSide {
  Top = 0,
  Bottom = 1,
}

export const endpointAnchor = (
  endpoint: IEdgeEndpoint,
  owner: INode,
  side: EdgeAnchorSide,
): IPoint => {
  if (isPort(endpoint)) {
    return {
      x: owner.x + endpoint.x + endpoint.width / 2,
      y: owner.y + endpoint.y + endpoint.height / 2,
    };
  }
  const centerX = endpoint.x + endpoint.width / 2;
  const y = side === EdgeAnchorSide.Bottom ? endpoint.y + endpoint.height : endpoint.y;
  return { x: centerX, y };
};
