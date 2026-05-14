/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Splits edges that span more than one layer into a chain of dummy nodes.
 *
 * Runs between layer assignment and crossing minimization so the barycenter
 * heuristic sees a "proper" layered graph — every edge connects two
 * adjacent layers. The edge router later reads the dummy positions off the
 * `LayeredContext` to lay each original long edge through them.
 *
 * Implementations need not produce dummies (e.g. a host that wants no
 * dummy-node behavior can wire `NullLongEdgeProcessor`).
 */

import { type LayeredContext } from './model/layered-context.js';

export interface ILongEdgeProcessor {
  process(context: LayeredContext): void;
}
