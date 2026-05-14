/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @benkalegin/filigree-alg-stress.
 */

export {
  StressAlgorithm,
  STRESS_ALGORITHM_ID,
  STRESS_DISPLAY_NAME,
} from './stress-algorithm.js';
export { StressOptions } from './stress-options.js';
export { createDefaultStressAlgorithm } from './composition.js';
