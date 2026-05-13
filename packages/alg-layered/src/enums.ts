/**
 * Pipeline stages of the layered (Sugiyama) algorithm.
 *
 * The values are stable identifiers used in observer events, debug dumps, and
 * tests. Order follows the run-time execution order.
 */

export enum LayeredPhase {
  CycleBreaking = 'cycle-breaking',
  LayerAssignment = 'layer-assignment',
  CrossingMinimization = 'crossing-minimization',
  NodePlacement = 'node-placement',
  EdgeRouting = 'edge-routing',
}
