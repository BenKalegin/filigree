/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @filigree/alg-force.
 */

export {
  ForceDirectedAlgorithm,
  FORCE_ALGORITHM_ID,
  FORCE_DISPLAY_NAME,
} from './force-directed-algorithm.js';
export { ForceOptions } from './force-options.js';
export { createDefaultForceAlgorithm } from './composition.js';
