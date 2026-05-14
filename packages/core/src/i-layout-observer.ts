/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Optional observer the engine invokes during layout.
 *
 * Used by debug tooling (tracing, profiling, snapshots). Default engine has
 * no observers. Multiple observers may be attached; observer methods must not
 * throw — the engine ignores observer failures.
 *
 * Splitting per-method (rather than one fat interface) honors Interface Segregation:
 * an observer that only wants algorithm-start does not have to no-op every other method.
 */

import { type LayoutPhaseEvent } from './enums.js';
import { type ILayoutAlgorithm } from './i-layout-algorithm.js';
import { type ILayoutContext } from './i-layout-context.js';
import { type PhaseId } from './phase-id.js';

export interface IAlgorithmStartObserver {
  onAlgorithmStarted(algorithm: ILayoutAlgorithm, context: ILayoutContext): void;
}

export interface IAlgorithmEndObserver {
  onAlgorithmCompleted(algorithm: ILayoutAlgorithm, context: ILayoutContext): void;
}

export interface IPhaseObserver {
  onPhase(event: LayoutPhaseEvent, phaseId: PhaseId, context: ILayoutContext): void;
}

export type ILayoutObserver = IAlgorithmStartObserver | IAlgorithmEndObserver | IPhaseObserver;
