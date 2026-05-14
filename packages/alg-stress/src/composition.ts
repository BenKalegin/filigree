/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Composition root for @filigree/alg-stress.
 */

import { StressAlgorithm } from './stress-algorithm.js';

export const createDefaultStressAlgorithm = (): StressAlgorithm => new StressAlgorithm();
