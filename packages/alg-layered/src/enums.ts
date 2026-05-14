/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Pipeline stages of the layered (Sugiyama) algorithm.
 *
 * The values are stable identifiers used in observer events, debug dumps, and
 * tests. Order follows the run-time execution order.
 */

export enum LayeredPhase {
  CycleBreaking = 'cycle-breaking',
  LayerAssignment = 'layer-assignment',
  LongEdgeProcessing = 'long-edge-processing',
  CrossingMinimization = 'crossing-minimization',
  NodePlacement = 'node-placement',
  EdgeRouting = 'edge-routing',
}
