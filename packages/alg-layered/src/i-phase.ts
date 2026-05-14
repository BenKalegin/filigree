/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Common shape of a layered-algorithm phase.
 *
 * Every phase reads from and writes to the layered context (intermediate
 * structures: layering, crossing positions, …) — never directly to the input
 * graph. The engine commits results back to the graph at the end.
 */

import { type LayeredPhase } from './enums.js';
import { type LayeredContext } from './model/layered-context.js';

export interface IPhase {
  readonly phase: LayeredPhase;
  execute(context: LayeredContext): void;
}
