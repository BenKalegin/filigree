/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * JSON serialization for ELK graphs. Format is compatible with elkjs.
 */

export type { IJsonEdge, IJsonGraph, IJsonLabel, IJsonNode, IJsonPort } from './types.js';
export { fromJson, type IFromJsonOptions } from './from-json.js';
export { toJson } from './to-json.js';
