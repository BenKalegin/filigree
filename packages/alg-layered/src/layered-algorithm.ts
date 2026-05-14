/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * The layered algorithm.
 *
 * Composes the 5 phases in fixed order:
 *   1. cycle breaking → 2. layer assignment → 3. crossing minimization
 *   4. node placement → 5. edge routing
 *
 * Each phase is injected. Swapping a phase is a constructor change, never a
 * pipeline change — that is the entire reason for the IPhase interface.
 */

import { type ILayoutAlgorithm, type ILayoutContext } from '@filigree/core';

import { type ICrossingMinimizer } from './i-crossing-minimizer.js';
import { type ICycleBreaker } from './i-cycle-breaker.js';
import { type IEdgeRouter } from './i-edge-router.js';
import { type ILayerAssigner } from './i-layer-assigner.js';
import { type INodePlacer } from './i-node-placer.js';
import { type LayeredContextBuilder } from './model/layered-context-builder.js';
import { type LayeredResultApplier } from './layered-result-applier.js';

export const LAYERED_ALGORITHM_ID = 'layered';
export const LAYERED_DISPLAY_NAME = 'Layered';

export interface ILayeredAlgorithmDeps {
  readonly contextBuilder: LayeredContextBuilder;
  readonly cycleBreaker: ICycleBreaker;
  readonly layerAssigner: ILayerAssigner;
  readonly crossingMinimizer: ICrossingMinimizer;
  readonly nodePlacer: INodePlacer;
  readonly edgeRouter: IEdgeRouter;
  readonly resultApplier: LayeredResultApplier;
}

export class LayeredAlgorithm implements ILayoutAlgorithm {
  public readonly id = LAYERED_ALGORITHM_ID;
  public readonly displayName = LAYERED_DISPLAY_NAME;

  constructor(private readonly deps: ILayeredAlgorithmDeps) {}

  public run(context: ILayoutContext): Promise<void> {
    const layered = this.deps.contextBuilder.build(context);
    this.deps.cycleBreaker.execute(layered);
    this.deps.layerAssigner.execute(layered);
    this.deps.crossingMinimizer.execute(layered);
    this.deps.nodePlacer.execute(layered);
    // Result applier writes node positions back to the user graph BEFORE the
    // router runs so that the router reads positioned nodes (it routes against
    // the user graph's ElkNodes, not the intermediate LNodes).
    this.deps.resultApplier.apply(layered);
    this.deps.edgeRouter.execute(layered);
    return Promise.resolve();
  }
}
