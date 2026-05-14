/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Composition root for @benkalegin/filigree-alg-force.
 */

import { ForceDirectedAlgorithm } from './force-directed-algorithm.js';

export const createDefaultForceAlgorithm = (): ForceDirectedAlgorithm =>
  new ForceDirectedAlgorithm();
