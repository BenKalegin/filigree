/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Phase 1 — break cycles so the graph becomes a DAG.
 *
 * Strategies differ by what they optimize for: minimum number of reversed
 * edges, minimum weight of reversed edges, model-order preservation, …
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface ICycleBreaker extends IPhase {
  readonly phase: LayeredPhase.CycleBreaking;
}
