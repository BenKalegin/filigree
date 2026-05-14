/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * The layered algorithm.
 *
 * Composes the pipeline in fixed order:
 *   1. cycle breaking → 2. layer assignment → 2.5 long-edge splitting →
 *   3. crossing minimization → 4. node placement → 5. edge routing
 *
 * Each phase is injected. Swapping a phase is a constructor change, never a
 * pipeline change — that is the entire reason for the IPhase interface.
 *
 * Phase boundaries fire `IPhaseObserver.onPhase(Started/Completed, …)` via
 * the context's dispatcher so tooling can trace per-phase progress.
 */

import {
  DirectionOption,
  EdgeRoutingOption,
  type ILayoutAlgorithm,
  type ILayoutContext,
  LayoutPhaseEvent,
  normalizeDirection,
  normalizeEdgeRouting,
  toPhaseId,
} from '@filigree/core';
import { EdgeRoutingStyle, LayoutDirection } from '@filigree/graph';

import {
  flipContainerX,
  flipContainerY,
  transposeContainer,
  untransposeContainer,
} from './direction-transform.js';
import { LayeredPhase } from './enums.js';
import { type ICrossingMinimizer } from './i-crossing-minimizer.js';
import { type ICycleBreaker } from './i-cycle-breaker.js';
import { type IEdgeRouter } from './i-edge-router.js';
import { type ILayerAssigner } from './i-layer-assigner.js';
import { type ILongEdgeProcessor } from './i-long-edge-processor.js';
import { type INodePlacer } from './i-node-placer.js';
import { type LayeredContext } from './model/layered-context.js';
import { type LayeredContextBuilder } from './model/layered-context-builder.js';
import { type LayeredResultApplier } from './layered-result-applier.js';

export const LAYERED_ALGORITHM_ID = 'layered';
export const LAYERED_DISPLAY_NAME = 'Layered';

/**
 * `OFF` and `POLYLINE` skip the router (renderer falls back to a straight
 * line). `SPLINES` falls through to the orthogonal router until spline
 * routing is ported.
 */
const ROUTING_STYLES_THAT_ROUTE: ReadonlySet<EdgeRoutingStyle> = new Set([
  EdgeRoutingStyle.Orthogonal,
  EdgeRoutingStyle.Splines,
]);

export interface ILayeredAlgorithmDeps {
  readonly contextBuilder: LayeredContextBuilder;
  readonly cycleBreaker: ICycleBreaker;
  readonly layerAssigner: ILayerAssigner;
  readonly longEdgeProcessor: ILongEdgeProcessor;
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
    const direction = normalizeDirection(context.options.resolve(DirectionOption, context.graph));
    const edgeRouting = normalizeEdgeRouting(
      context.options.resolve(EdgeRoutingOption, context.graph),
    );
    this.applyPreLayoutTransform(context, direction);
    const layered = this.deps.contextBuilder.build(context);
    this.runPhase(context, layered, LayeredPhase.CycleBreaking, (l) =>
      { this.deps.cycleBreaker.execute(l); },
    );
    this.runPhase(context, layered, LayeredPhase.LayerAssignment, (l) =>
      { this.deps.layerAssigner.execute(l); },
    );
    this.runPhase(context, layered, LayeredPhase.LongEdgeProcessing, (l) =>
      { this.deps.longEdgeProcessor.process(l); },
    );
    this.runPhase(context, layered, LayeredPhase.CrossingMinimization, (l) =>
      { this.deps.crossingMinimizer.execute(l); },
    );
    this.runPhase(context, layered, LayeredPhase.NodePlacement, (l) =>
      { this.deps.nodePlacer.execute(l); },
    );
    // Result applier writes node positions back to the user graph BEFORE the
    // router runs so that the router reads positioned nodes (it routes
    // against the user graph's ElkNodes, not the intermediate LNodes).
    this.deps.resultApplier.apply(layered);
    this.runPhase(context, layered, LayeredPhase.EdgeRouting, (l) => {
      if (ROUTING_STYLES_THAT_ROUTE.has(edgeRouting)) {
        this.deps.edgeRouter.execute(l);
      }
    });
    this.applyPostLayoutTransform(context, direction);
    return Promise.resolve();
  }

  private applyPreLayoutTransform(context: ILayoutContext, direction: LayoutDirection): void {
    if (direction === LayoutDirection.Right || direction === LayoutDirection.Left) {
      transposeContainer(context.graph);
    }
  }

  private applyPostLayoutTransform(context: ILayoutContext, direction: LayoutDirection): void {
    switch (direction) {
      case LayoutDirection.Right: {
        untransposeContainer(context.graph);
        break;
      }
      case LayoutDirection.Left: {
        untransposeContainer(context.graph);
        flipContainerX(context.graph);
        break;
      }
      case LayoutDirection.Up: {
        flipContainerY(context.graph);
        break;
      }
      case LayoutDirection.Down:
      case LayoutDirection.Undefined: {
        break;
      }
    }
  }

  private runPhase(
    context: ILayoutContext,
    layered: LayeredContext,
    phase: LayeredPhase,
    work: (layered: LayeredContext) => void,
  ): void {
    if (context.dispatcher.hasObservers) {
      context.dispatcher.phase(LayoutPhaseEvent.Started, toPhaseId(phase), context);
    }
    work(layered);
    if (context.dispatcher.hasObservers) {
      context.dispatcher.phase(LayoutPhaseEvent.Completed, toPhaseId(phase), context);
    }
  }
}
