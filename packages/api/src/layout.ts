/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * One-call entry point: lay out a graph with the algorithm requested via
 * the `algorithm` option (or `elk.algorithm` on the graph itself) and
 * return the laid-out graph.
 *
 * Accepts either an elkjs-style JSON shape (lifted via `fromJson`) or an
 * already-built `ElkGraph`. Use the latter when you need to attach
 * `@filigree/hints` before layout runs — those hints sit on the graph as
 * a property and can't be expressed in raw JSON.
 *
 * Built atop a singleton default engine that registers every algorithm
 * shipped in this workspace. Hosts that need a different combination
 * should build their own `DefaultLayoutEngine` directly.
 */

import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import { createDefaultLayeredAlgorithm } from '@filigree/alg-layered';
import { createDefaultMrTreeAlgorithm } from '@filigree/alg-mrtree';
import { createDefaultRadialAlgorithm } from '@filigree/alg-radial';
import { createDefaultRectPackingAlgorithm } from '@filigree/alg-rectpacking';
import { createDefaultStressAlgorithm } from '@filigree/alg-stress';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { defineProperty, ElkGraph, fromJson, type IJsonGraph } from '@filigree/graph';
import { attachHints, parseJsonHints } from '@filigree/hints';

const ALGORITHM_OPTION_KEY = 'elk.algorithm';

export interface ILayoutOptions {
  /**
   * Layout algorithm id. Built-in choices: `'layered'` (default, top-to-
   * bottom Sugiyama), `'force'` (Fruchterman-Reingold), `'mrtree'`
   * (Reingold-Tilford), `'radial'` (concentric tree), `'rectpacking'`
   * (shelf packing), `'stress'` (stress majorization). Anything else
   * throws `AlgorithmNotFoundError` unless you've registered your own
   * algorithm via a custom engine.
   */
  readonly algorithm?: string;
}

let defaultEngine: ILayoutEngine | undefined;

const getDefaultEngine = (): ILayoutEngine => {
  if (defaultEngine === undefined) {
    const registry = new DefaultAlgorithmRegistry();
    registry.register(createDefaultLayeredAlgorithm());
    registry.register(createDefaultForceAlgorithm());
    registry.register(createDefaultMrTreeAlgorithm());
    registry.register(createDefaultRadialAlgorithm());
    registry.register(createDefaultRectPackingAlgorithm());
    registry.register(createDefaultStressAlgorithm());
    defaultEngine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
  }
  return defaultEngine;
};

export const layout = async (
  input: IJsonGraph | ElkGraph,
  options: ILayoutOptions = {},
): Promise<ElkGraph> => {
  const graph =
    input instanceof ElkGraph
      ? withAlgorithmAttached(input, options.algorithm)
      : fromJsonWithHints(applyAlgorithmOption(input, options.algorithm));
  await getDefaultEngine().layout(graph);
  return graph;
};

const fromJsonWithHints = (input: IJsonGraph): ElkGraph => {
  const graph = fromJson(input);
  const parsedHints = parseJsonHints(input.filigreeHints);
  if (parsedHints.length > 0) attachHints(graph, parsedHints);
  return graph;
};

const applyAlgorithmOption = (input: IJsonGraph, algorithm: string | undefined): IJsonGraph => {
  if (algorithm === undefined) return input;
  return {
    ...input,
    layoutOptions: { ...input.layoutOptions, [ALGORITHM_OPTION_KEY]: algorithm },
  };
};

const ALGORITHM_PROPERTY = defineProperty<string | undefined>({
  id: ALGORITHM_OPTION_KEY,
  defaultValue: undefined,
});

const withAlgorithmAttached = (graph: ElkGraph, algorithm: string | undefined): ElkGraph => {
  if (algorithm !== undefined) {
    graph.setProperty(ALGORITHM_PROPERTY, algorithm);
  }
  return graph;
};
