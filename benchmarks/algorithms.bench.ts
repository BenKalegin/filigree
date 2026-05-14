/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Cross-algorithm comparison: same graph (where applicable) laid out by
 * each of the six shipped algorithms. Useful for spotting outliers when
 * tuning per-algorithm performance.
 *
 * Algorithms read different aspects of the input, so we can't use one
 * fixture for everything:
 *   - layered / force / stress / network-simplex: random mesh DAG
 *   - mrtree / radial: balanced tree
 *   - rectpacking: edge-free card grid
 */

import { bench, describe } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutAlgorithm,
} from '@filigree/core';
import { fromJson, type IJsonGraph } from '@filigree/graph';
import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import { createDefaultLayeredAlgorithm } from '@filigree/alg-layered';
import { createDefaultMrTreeAlgorithm } from '@filigree/alg-mrtree';
import { createDefaultRadialAlgorithm } from '@filigree/alg-radial';
import { createDefaultRectPackingAlgorithm } from '@filigree/alg-rectpacking';
import { createDefaultStressAlgorithm } from '@filigree/alg-stress';

import { balancedTree, cards, randomDag, randomMesh } from './fixtures.js';

type AlgorithmFactory = () => ILayoutAlgorithm;

const runWith = async (factory: AlgorithmFactory, json: IJsonGraph): Promise<void> => {
  const algorithm = factory();
  const registry = new DefaultAlgorithmRegistry();
  registry.register(algorithm);
  const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
  const graph = fromJson({
    ...json,
    layoutOptions: { ...json.layoutOptions, 'elk.algorithm': algorithm.id },
  });
  await engine.layout(graph);
};

const DAG = randomDag(40, 0.08);
const MESH = randomMesh(40, 3);
const TREE = balancedTree(3, 4);
const CARDS = cards(40);

describe('all algorithms on size-40 inputs', () => {
  bench('layered (random DAG)', async () => {
    await runWith(createDefaultLayeredAlgorithm, DAG);
  });
  bench('force (random mesh)', async () => {
    await runWith(createDefaultForceAlgorithm, MESH);
  });
  bench('stress (random mesh)', async () => {
    await runWith(createDefaultStressAlgorithm, MESH);
  });
  bench('mrtree (balanced 3-ary depth 4)', async () => {
    await runWith(createDefaultMrTreeAlgorithm, TREE);
  });
  bench('radial (balanced 3-ary depth 4)', async () => {
    await runWith(createDefaultRadialAlgorithm, TREE);
  });
  bench('rectpacking (40 cards)', async () => {
    await runWith(createDefaultRectPackingAlgorithm, CARDS);
  });
});
