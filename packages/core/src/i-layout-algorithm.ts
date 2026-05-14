/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Contract every layout algorithm implements.
 *
 * The engine reaches an algorithm through this interface and only this interface.
 * Algorithms must not retain state between invocations — every call gets a fresh
 * context. This is the Liskov-substitution boundary: any algorithm can be swapped
 * for any other without the engine knowing.
 */

import { type ILayoutContext } from './i-layout-context.js';

export interface ILayoutAlgorithm {
  readonly id: string;
  readonly displayName: string;

  run(context: ILayoutContext): Promise<void>;
}
