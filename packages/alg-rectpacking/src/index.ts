/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @filigree/alg-rectpacking.
 */

export {
  RectPackingAlgorithm,
  RECTPACKING_ALGORITHM_ID,
  RECTPACKING_DISPLAY_NAME,
} from './rectpacking-algorithm.js';
export { RectPackingOptions } from './rectpacking-options.js';
export { createDefaultRectPackingAlgorithm } from './composition.js';
