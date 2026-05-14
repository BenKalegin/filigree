/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * The graph root.
 *
 * In ELK the root is itself a compound node — there is no separate "graph" type
 * distinct from "node". We keep that flavor for API symmetry while giving consumers
 * a single named entry point.
 */

import { type INode } from './i-node.js';

export interface IGraph extends INode {
  readonly root: true;
}
