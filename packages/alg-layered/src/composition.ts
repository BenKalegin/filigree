/**
 * Default composition root for `@elk/alg-layered`.
 *
 * Returns a `LayeredAlgorithm` wired with the simplest strategies available
 * for each phase. Hosts that want a different strategy combination construct
 * `LayeredAlgorithm` directly with their own dependency object.
 */

import { LayeredAlgorithm } from './layered-algorithm.js';
import { LayeredContextBuilder } from './model/layered-context-builder.js';
import { LayeredResultApplier } from './layered-result-applier.js';
import { BarycenterCrossingMinimizer } from './phases/crossing-minimization/barycenter-crossing-minimizer.js';
import { GreedyCycleBreaker } from './phases/cycle-breaking/greedy-cycle-breaker.js';
import { OrthogonalEdgeRouter } from './phases/edge-routing/orthogonal-edge-router.js';
import { BrandesKopfNodePlacer } from './phases/node-placement/brandes-kopf-node-placer.js';
import { LongestPathLayerer } from './phases/layer-assignment/longest-path-layerer.js';

export const createDefaultLayeredAlgorithm = (): LayeredAlgorithm =>
  new LayeredAlgorithm({
    contextBuilder: new LayeredContextBuilder(),
    cycleBreaker: new GreedyCycleBreaker(),
    layerAssigner: new LongestPathLayerer(),
    crossingMinimizer: new BarycenterCrossingMinimizer(),
    nodePlacer: new BrandesKopfNodePlacer(),
    edgeRouter: new OrthogonalEdgeRouter(),
    resultApplier: new LayeredResultApplier(),
  });
