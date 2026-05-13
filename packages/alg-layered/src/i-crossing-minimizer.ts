/**
 * Phase 3 — reorder nodes within each layer to minimize edge crossings.
 *
 * Typical strategies: barycenter, median, branch-and-bound.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface ICrossingMinimizer extends IPhase {
  readonly phase: LayeredPhase.CrossingMinimization;
}
