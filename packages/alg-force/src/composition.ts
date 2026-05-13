/**
 * Composition root for @elk/alg-force.
 */

import { ForceDirectedAlgorithm } from './force-directed-algorithm.js';

export const createDefaultForceAlgorithm = (): ForceDirectedAlgorithm =>
  new ForceDirectedAlgorithm();
