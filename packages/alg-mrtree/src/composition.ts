/**
 * Composition root for @filigree/alg-mrtree.
 */

import { MrTreeAlgorithm } from './mrtree-algorithm.js';

export const createDefaultMrTreeAlgorithm = (): MrTreeAlgorithm => new MrTreeAlgorithm();
