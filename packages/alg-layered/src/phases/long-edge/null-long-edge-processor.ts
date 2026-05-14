/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * No-op long-edge processor. Useful in tests or hosts that want to opt out
 * of dummy-node insertion (e.g. for benchmarking the raw pipeline cost).
 */

import { type ILongEdgeProcessor } from '../../i-long-edge-processor.js';

export class NullLongEdgeProcessor implements ILongEdgeProcessor {
  public process(): void {
    // Intentionally empty.
  }
}
