/**
 * Public surface of @filigree/graph. External consumers may import only what this file re-exports.
 */

export { NodeKind, PortSide, LayoutDirection, EdgeRoutingStyle } from './enums.js';
export { type GraphElementId, toGraphElementId } from './identity.js';
export { type PropertyId, toPropertyId } from './property-id.js';
export type { IPoint, IDimensions, IRect } from './coordinates.js';
export {
  type IProperty,
  type IPropertyHolder,
  type IDefinePropertyInput,
  defineProperty,
} from './property.js';
export type { IGraphElement } from './i-graph-element.js';
export type { ILabel } from './i-label.js';
export type { IPort } from './i-port.js';
export type { IEdge, IEdgeEndpoint } from './i-edge.js';
export type { INode } from './i-node.js';
export type { IGraph } from './i-graph.js';
export { isNode, isPort } from './type-guards.js';
export { EdgeAnchorSide, endpointAnchor } from './anchors.js';
export { GraphErrorName, GraphError, InvalidGraphError, UnknownPropertyError } from './errors.js';
export { PropertyHolder } from './property-holder.js';
export { ElkLabel, type IElkLabelInput } from './elk-label.js';
export { ElkPort, type IElkPortInput } from './elk-port.js';
export { ElkEdge, type IElkEdgeInput } from './elk-edge.js';
export { ElkNode, type IElkNodeInput } from './elk-node.js';
export { ElkGraph, type IElkGraphInput } from './elk-graph.js';
export { type IIdAllocator } from './i-id-allocator.js';
export { CountingIdAllocator, type ICountingIdAllocatorOptions } from './counting-id-allocator.js';
export { GraphFactory, type IGraphFactoryOptions } from './graph-factory.js';
export {
  type IFromJsonOptions,
  type IJsonEdge,
  type IJsonGraph,
  type IJsonLabel,
  type IJsonNode,
  type IJsonPort,
  fromJson,
  toJson,
} from './json/index.js';
