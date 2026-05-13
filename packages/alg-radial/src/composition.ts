/**
 * Composition root for @filigree/alg-radial.
 */

import { RadialAlgorithm } from './radial-algorithm.js';

export const createDefaultRadialAlgorithm = (): RadialAlgorithm => new RadialAlgorithm();
