/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @benkalegin/filigree-alg-layered.
 */

export { LayeredPhase } from './enums.js';
export type { IPhase } from './i-phase.js';
export type { ICycleBreaker } from './i-cycle-breaker.js';
export type { ILayerAssigner } from './i-layer-assigner.js';
export type { ICrossingMinimizer } from './i-crossing-minimizer.js';
export type { ILongEdgeProcessor } from './i-long-edge-processor.js';
export type { INodePlacer } from './i-node-placer.js';
export type { IEdgeRouter } from './i-edge-router.js';
export { LNode, LNodeKind } from './model/l-node.js';
export { LayeredContext, type ILayeredContextInput } from './model/layered-context.js';
export { LayeredContextBuilder } from './model/layered-context-builder.js';
export { appendUnique } from './model/adjacency.js';
export { layerHeight, placeNodesLinearly } from './model/layer-utils.js';
export {
  LayeredAlgorithm,
  type ILayeredAlgorithmDeps,
  LAYERED_ALGORITHM_ID,
  LAYERED_DISPLAY_NAME,
} from './layered-algorithm.js';
export { LayeredResultApplier } from './layered-result-applier.js';
export { LayeredOptions } from './layered-options.js';
export { createNullPhase } from './null-phase.js';
export { GreedyCycleBreaker } from './phases/cycle-breaking/greedy-cycle-breaker.js';
export { LongestPathLayerer } from './phases/layer-assignment/longest-path-layerer.js';
export { NetworkSimplexLayerer } from './phases/layer-assignment/network-simplex-layerer.js';
export { HintAwareLayerer } from './phases/layer-assignment/hint-aware-layerer.js';
export { BarycenterCrossingMinimizer } from './phases/crossing-minimization/barycenter-crossing-minimizer.js';
export { HintAwareCrossingMinimizer } from './phases/crossing-minimization/hint-aware-crossing-minimizer.js';
export { LinearNodePlacer } from './phases/node-placement/linear-node-placer.js';
export { BalancedNodePlacer } from './phases/node-placement/balanced-node-placer.js';
export { BrandesKopfNodePlacer } from './phases/node-placement/brandes-kopf-node-placer.js';
export { OrthogonalEdgeRouter } from './phases/edge-routing/orthogonal-edge-router.js';
export { DummyLongEdgeProcessor } from './phases/long-edge/dummy-long-edge-processor.js';
export { NullLongEdgeProcessor } from './phases/long-edge/null-long-edge-processor.js';
export { createDefaultLayeredAlgorithm } from './composition.js';
