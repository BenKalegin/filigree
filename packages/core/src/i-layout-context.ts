/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Per-invocation context an algorithm receives.
 *
 * Algorithms read the input graph and the option resolver from the context.
 * They do not mutate the input graph directly during a phase; mutations are
 * applied at the end of the layout run by the engine. This keeps phases
 * idempotent and makes them testable in isolation.
 */

import { type INode } from '@benkalegin/filigree-graph';

import { type EventDispatcher } from './event-dispatcher.js';
import { type IOptionResolver } from './i-option.js';

export interface ILayoutContext {
  /**
   * The (sub-)graph root for this layout invocation. May be the user's
   * root `IGraph` or any compound `INode` being laid out as part of a
   * hierarchical run.
   */
  readonly graph: INode;
  readonly options: IOptionResolver;
  /**
   * Observer dispatcher. Algorithms fire phase events through it; the
   * engine fires algorithm-start/complete around each `algorithm.run`.
   * Always present (the engine constructs one even when no observers are
   * attached — `EventDispatcher.hasObservers` short-circuits empty
   * dispatch).
   */
  readonly dispatcher: EventDispatcher;
}
