/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Phase 5 — compute edge polyline geometry given placed nodes.
 *
 * Strategies: polyline, orthogonal, splines.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface IEdgeRouter extends IPhase {
  readonly phase: LayeredPhase.EdgeRouting;
}
