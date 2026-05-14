/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Engine builders used by the layout examples generator.
 *
 * Kept in their own file so `generate-docs.ts` stays well under the
 * `max-lines` limit. Each builder returns a fresh `ILayoutEngine` so
 * examples never share mutable registry state.
 */

import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import { createDefaultMrTreeAlgorithm } from '@filigree/alg-mrtree';
import { createDefaultRadialAlgorithm } from '@filigree/alg-radial';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';

import {
  BarycenterCrossingMinimizer,
  BrandesKopfNodePlacer,
  DummyLongEdgeProcessor,
  GreedyCycleBreaker,
  HintAwareCrossingMinimizer,
  HintAwareLayerer,
  type INodePlacer,
  LayeredAlgorithm,
  LayeredContextBuilder,
  LayeredResultApplier,
  LongestPathLayerer,
  OrthogonalEdgeRouter,
} from '../src/index.js';

export const buildLayeredEngine = (nodePlacer: INodePlacer): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(
    new LayeredAlgorithm({
      contextBuilder: new LayeredContextBuilder(),
      cycleBreaker: new GreedyCycleBreaker(),
      layerAssigner: new LongestPathLayerer(),
      longEdgeProcessor: new DummyLongEdgeProcessor(),
      crossingMinimizer: new BarycenterCrossingMinimizer(),
      nodePlacer,
      edgeRouter: new OrthogonalEdgeRouter(),
      resultApplier: new LayeredResultApplier(),
    }),
  );
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

export const buildHintAwareLayeredEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(
    new LayeredAlgorithm({
      contextBuilder: new LayeredContextBuilder(),
      cycleBreaker: new GreedyCycleBreaker(),
      layerAssigner: new HintAwareLayerer(new LongestPathLayerer()),
      longEdgeProcessor: new DummyLongEdgeProcessor(),
      crossingMinimizer: new HintAwareCrossingMinimizer(new BarycenterCrossingMinimizer()),
      nodePlacer: new BrandesKopfNodePlacer(),
      edgeRouter: new OrthogonalEdgeRouter(),
      resultApplier: new LayeredResultApplier(),
    }),
  );
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

export const buildForceEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultForceAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

export const buildMrTreeEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultMrTreeAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

export const buildRadialEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultRadialAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};
