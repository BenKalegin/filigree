/**
 * Generic factory for no-op phase implementations.
 *
 * Replaces three near-identical classes (NullCycleBreaker,
 * NullCrossingMinimizer, NullEdgeRouter) that each just declared their
 * `phase` and ran no-op `execute`. The return type narrows `phase` to the
 * specific enum literal supplied, so call sites can still assign the result
 * to a phase-specific interface like `ICycleBreaker`:
 *
 *   const cycleBreaker: ICycleBreaker = createNullPhase(LayeredPhase.CycleBreaking);
 *
 * Used during incremental development to disable a phase without changing
 * the pipeline shape.
 */

import { type LayeredPhase } from './enums.js';
import { type IPhase } from './i-phase.js';

export const createNullPhase = <P extends LayeredPhase>(
  phase: P,
): IPhase & { readonly phase: P } => ({
  phase,
  execute: () => {
    // No-op.
  },
});
