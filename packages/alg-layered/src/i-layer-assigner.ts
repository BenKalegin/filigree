/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Phase 2 — assign each node to a horizontal layer.
 *
 * Strategies: longest-path, Coffman-Graham, network-simplex, stretch-width.
 * All produce the same observable outcome (every node has a layer index);
 * they differ in tightness, runtime, and how they handle wide layers.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface ILayerAssigner extends IPhase {
  readonly phase: LayeredPhase.LayerAssignment;
}
