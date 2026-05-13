/**
 * Composition root for @filigree/alg-force.
 */

import { ForceDirectedAlgorithm } from './force-directed-algorithm.js';

export const createDefaultForceAlgorithm = (): ForceDirectedAlgorithm =>
  new ForceDirectedAlgorithm();
