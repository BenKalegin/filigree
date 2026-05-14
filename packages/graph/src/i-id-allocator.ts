/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Allocates `GraphElementId` values when callers don't provide one.
 *
 * Injected into `GraphFactory` so tests can swap in a deterministic allocator
 * (counter-based) while production code uses a randomized one if needed.
 */

import { type GraphElementId } from './identity.js';

export interface IIdAllocator {
  next(): GraphElementId;
}
