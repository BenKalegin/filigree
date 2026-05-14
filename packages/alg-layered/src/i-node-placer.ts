/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Phase 4 — assign final coordinates to nodes within each layer.
 *
 * Strategies: linear-segments, Brandes-Köpf, simple-incremental.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface INodePlacer extends IPhase {
  readonly phase: LayeredPhase.NodePlacement;
}
