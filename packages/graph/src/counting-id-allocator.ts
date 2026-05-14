/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Deterministic, counter-based `IIdAllocator`.
 *
 * Default factory dependency. Predictable in tests; sufficient for any single
 * graph build because ids only need to be unique within one graph.
 */

import { type GraphElementId, toGraphElementId } from './identity.js';
import { type IIdAllocator } from './i-id-allocator.js';

export interface ICountingIdAllocatorOptions {
  readonly prefix?: string;
}

export class CountingIdAllocator implements IIdAllocator {
  private readonly prefix: string;
  private counter = 0;

  constructor(options: ICountingIdAllocatorOptions = {}) {
    this.prefix = options.prefix ?? 'elem-';
  }

  public next(): GraphElementId {
    this.counter += 1;
    return toGraphElementId(`${this.prefix}${String(this.counter)}`);
  }
}
