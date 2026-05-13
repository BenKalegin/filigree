/**
 * Phase 5 — compute edge polyline geometry given placed nodes.
 *
 * Strategies: polyline, orthogonal, splines.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export interface IEdgeRouter extends IPhase {
  readonly phase: LayeredPhase.EdgeRouting;
}
