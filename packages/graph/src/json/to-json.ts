/**
 * Entry point for serializing an `ElkGraph` to elkjs-compatible JSON.
 */

import { type ElkGraph } from '../elk-graph.js';
import { JsonSerializer } from './json-serializer.js';
import { type IJsonGraph } from './types.js';

export const toJson = (graph: ElkGraph): IJsonGraph => new JsonSerializer().serializeGraph(graph);
