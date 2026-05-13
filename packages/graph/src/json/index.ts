/**
 * JSON serialization for ELK graphs. Format is compatible with elkjs.
 */

export type { IJsonEdge, IJsonGraph, IJsonLabel, IJsonNode, IJsonPort } from './types.js';
export { fromJson, type IFromJsonOptions } from './from-json.js';
export { toJson } from './to-json.js';
