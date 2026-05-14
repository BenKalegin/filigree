/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Default composition root for `@filigree/alg-layered`.
 *
 * Returns a `LayeredAlgorithm` wired with the simplest strategies available
 * for each phase. Hosts that want a different strategy combination construct
 * `LayeredAlgorithm` directly with their own dependency object.
 */

import { LayeredAlgorithm } from './layered-algorithm.js';
import { LayeredContextBuilder } from './model/layered-context-builder.js';
import { LayeredResultApplier } from './layered-result-applier.js';
import { BarycenterCrossingMinimizer } from './phases/crossing-minimization/barycenter-crossing-minimizer.js';
import { HintAwareCrossingMinimizer } from './phases/crossing-minimization/hint-aware-crossing-minimizer.js';
import { GreedyCycleBreaker } from './phases/cycle-breaking/greedy-cycle-breaker.js';
import { OrthogonalEdgeRouter } from './phases/edge-routing/orthogonal-edge-router.js';
import { BrandesKopfNodePlacer } from './phases/node-placement/brandes-kopf-node-placer.js';
import { HintAwareLayerer } from './phases/layer-assignment/hint-aware-layerer.js';
import { LongestPathLayerer } from './phases/layer-assignment/longest-path-layerer.js';
import { DummyLongEdgeProcessor } from './phases/long-edge/dummy-long-edge-processor.js';

export const createDefaultLayeredAlgorithm = (): LayeredAlgorithm =>
  new LayeredAlgorithm({
    contextBuilder: new LayeredContextBuilder(),
    cycleBreaker: new GreedyCycleBreaker(),
    // Wrapped so SameLayer / OrderBefore hints attached to the graph
    // get honored. The decorators no-op when no hints are present.
    layerAssigner: new HintAwareLayerer(new LongestPathLayerer()),
    longEdgeProcessor: new DummyLongEdgeProcessor(),
    crossingMinimizer: new HintAwareCrossingMinimizer(new BarycenterCrossingMinimizer()),
    nodePlacer: new BrandesKopfNodePlacer(),
    edgeRouter: new OrthogonalEdgeRouter(),
    resultApplier: new LayeredResultApplier(),
  });
