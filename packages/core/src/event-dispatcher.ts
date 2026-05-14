/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Iterates a list of observers, invoking the appropriate method on each one
 * that implements the relevant `IxxxObserver` slice.
 *
 * Honors the contract from `ILayoutObserver`: observer methods may throw,
 * but a throwing observer must not break the layout. Each invocation is
 * wrapped in a try/catch — the engine and algorithms see no failures from
 * observer code.
 *
 * Empty-list short-circuits at the call site (`observers.length === 0`),
 * not inside this class, so the hot path stays free of method calls when
 * no observer is attached.
 */

import { type LayoutPhaseEvent } from './enums.js';
import {
  type IAlgorithmEndObserver,
  type IAlgorithmStartObserver,
  type ILayoutObserver,
  type IPhaseObserver,
} from './i-layout-observer.js';
import { type ILayoutAlgorithm } from './i-layout-algorithm.js';
import { type ILayoutContext } from './i-layout-context.js';
import { type PhaseId } from './phase-id.js';

export class EventDispatcher {
  constructor(private readonly observers: readonly ILayoutObserver[]) {}

  public get hasObservers(): boolean {
    return this.observers.length > 0;
  }

  public algorithmStarted(algorithm: ILayoutAlgorithm, context: ILayoutContext): void {
    for (const observer of this.observers) {
      if (!isAlgorithmStartObserver(observer)) continue;
      safeInvoke(() => {
        observer.onAlgorithmStarted(algorithm, context);
      });
    }
  }

  public algorithmCompleted(algorithm: ILayoutAlgorithm, context: ILayoutContext): void {
    for (const observer of this.observers) {
      if (!isAlgorithmEndObserver(observer)) continue;
      safeInvoke(() => {
        observer.onAlgorithmCompleted(algorithm, context);
      });
    }
  }

  public phase(event: LayoutPhaseEvent, phaseId: PhaseId, context: ILayoutContext): void {
    for (const observer of this.observers) {
      if (!isPhaseObserver(observer)) continue;
      safeInvoke(() => {
        observer.onPhase(event, phaseId, context);
      });
    }
  }
}

const isAlgorithmStartObserver = (
  observer: ILayoutObserver,
): observer is IAlgorithmStartObserver =>
  typeof (observer as Partial<IAlgorithmStartObserver>).onAlgorithmStarted === 'function';

const isAlgorithmEndObserver = (
  observer: ILayoutObserver,
): observer is IAlgorithmEndObserver =>
  typeof (observer as Partial<IAlgorithmEndObserver>).onAlgorithmCompleted === 'function';

const isPhaseObserver = (observer: ILayoutObserver): observer is IPhaseObserver =>
  typeof (observer as Partial<IPhaseObserver>).onPhase === 'function';

const safeInvoke = (fn: () => void): void => {
  try {
    fn();
  } catch {
    // Observer errors are intentionally swallowed — see class comment.
  }
};
