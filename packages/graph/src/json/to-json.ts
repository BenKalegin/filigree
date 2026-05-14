/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Entry point for serializing an `ElkGraph` to elkjs-compatible JSON.
 */

import { type ElkGraph } from '../elk-graph.js';
import { JsonSerializer } from './json-serializer.js';
import { type IJsonGraph } from './types.js';

export const toJson = (graph: ElkGraph): IJsonGraph => new JsonSerializer().serializeGraph(graph);
