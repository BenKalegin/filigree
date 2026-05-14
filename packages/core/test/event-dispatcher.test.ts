/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import { EventDispatcher } from '../src/event-dispatcher.js';
import { LayoutPhaseEvent } from '../src/enums.js';
import { toPhaseId } from '../src/phase-id.js';
import {
  type IAlgorithmEndObserver,
  type IAlgorithmStartObserver,
  type IPhaseObserver,
} from '../src/i-layout-observer.js';
import { type ILayoutAlgorithm } from '../src/i-layout-algorithm.js';
import { type ILayoutContext } from '../src/i-layout-context.js';

const stubAlgorithm: ILayoutAlgorithm = {
  id: 'test',
  displayName: 'Test',
  run: () => Promise.resolve(),
};

const stubContext = {
  graph: undefined,
  options: undefined,
  dispatcher: undefined,
} as unknown as ILayoutContext;

describe('EventDispatcher', () => {
  it('reports hasObservers correctly', () => {
    expect(new EventDispatcher([]).hasObservers).toBe(false);
    const observer: IPhaseObserver = {
      onPhase: () => {
        /* noop */
      },
    };
    expect(new EventDispatcher([observer]).hasObservers).toBe(true);
  });

  it('invokes start observers and skips ones that do not implement the slice', () => {
    const onStart = vi.fn();
    const onPhase = vi.fn();
    const startObserver: IAlgorithmStartObserver = { onAlgorithmStarted: onStart };
    const phaseObserver: IPhaseObserver = { onPhase };
    new EventDispatcher([startObserver, phaseObserver]).algorithmStarted(
      stubAlgorithm,
      stubContext,
    );
    expect(onStart).toHaveBeenCalledOnce();
    expect(onPhase).not.toHaveBeenCalled();
  });

  it('invokes phase observers with the event, id, and context', () => {
    const onPhase = vi.fn();
    const observer: IPhaseObserver = { onPhase };
    new EventDispatcher([observer]).phase(
      LayoutPhaseEvent.Started,
      toPhaseId('cycle-breaking'),
      stubContext,
    );
    expect(onPhase).toHaveBeenCalledWith(
      LayoutPhaseEvent.Started,
      'cycle-breaking',
      stubContext,
    );
  });

  it('swallows observer errors so layout is unaffected', () => {
    const throwingObserver: IAlgorithmEndObserver = {
      onAlgorithmCompleted: () => {
        throw new Error('boom');
      },
    };
    const otherCalls = vi.fn();
    const followingObserver: IAlgorithmEndObserver = { onAlgorithmCompleted: otherCalls };
    const dispatcher = new EventDispatcher([throwingObserver, followingObserver]);
    expect(() => {
      dispatcher.algorithmCompleted(stubAlgorithm, stubContext);
    }).not.toThrow();
    // Observers after the throwing one still fire.
    expect(otherCalls).toHaveBeenCalledOnce();
  });
});
