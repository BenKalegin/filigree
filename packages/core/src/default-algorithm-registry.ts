/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * In-memory `IAlgorithmRegistry` backed by a `Map`.
 *
 * Registration is explicit — no auto-discovery, no extension points. Hosts that
 * want lazy loading or a curated set of algorithms compose their own registry
 * around this one.
 */

import { OptionConflictError } from './errors.js';
import { type IAlgorithmRegistry } from './i-algorithm-registry.js';
import { type ILayoutAlgorithm } from './i-layout-algorithm.js';

export class DefaultAlgorithmRegistry implements IAlgorithmRegistry {
  private readonly algorithmsById = new Map<string, ILayoutAlgorithm>();

  public register(algorithm: ILayoutAlgorithm): void {
    if (this.algorithmsById.has(algorithm.id)) {
      throw new OptionConflictError(`Algorithm already registered: ${algorithm.id}`);
    }
    this.algorithmsById.set(algorithm.id, algorithm);
  }

  public get(id: string): ILayoutAlgorithm | undefined {
    return this.algorithmsById.get(id);
  }

  public list(): readonly ILayoutAlgorithm[] {
    return [...this.algorithmsById.values()];
  }
}
