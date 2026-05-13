/**
 * One-call entry point: parse an elkjs-style JSON graph, lay it out with the
 * algorithm requested via the `algorithm` option (or `elk.algorithm` on the
 * graph itself), and return the laid-out graph.
 *
 * Built atop a singleton default engine that has both Layered and Force
 * registered. Hosts that need a custom set of algorithms or a non-default
 * resolver should build their own `DefaultLayoutEngine` directly.
 */

import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import { createDefaultLayeredAlgorithm } from '@filigree/alg-layered';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { type ElkGraph, fromJson, type IJsonGraph } from '@filigree/graph';

const ALGORITHM_OPTION_KEY = 'elk.algorithm';

export interface ILayoutOptions {
  /**
   * Layout algorithm id. Built-in choices: `'layered'` (default,
   * top-to-bottom Sugiyama) or `'force'` (Fruchterman-Reingold). Anything
   * else throws `AlgorithmNotFoundError` unless you've registered your own
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
    defaultEngine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
  }
  return defaultEngine;
};

export const layout = async (
  input: IJsonGraph,
  options: ILayoutOptions = {},
): Promise<ElkGraph> => {
  const withAlgorithm = applyAlgorithmOption(input, options.algorithm);
  const graph = fromJson(withAlgorithm);
  await getDefaultEngine().layout(graph);
  return graph;
};

const applyAlgorithmOption = (input: IJsonGraph, algorithm: string | undefined): IJsonGraph => {
  if (algorithm === undefined) {
    return input;
  }
  return {
    ...input,
    layoutOptions: { ...input.layoutOptions, [ALGORITHM_OPTION_KEY]: algorithm },
  };
};
