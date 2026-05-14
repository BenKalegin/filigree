/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Force-directed benchmarks: exact O(n²) vs Barnes-Hut O(n log n).
 *
 * Same input graph laid out with `useBarnesHut: false` and
 * `useBarnesHut: true`. The crossover where Barnes-Hut wins is around
 * 60–80 nodes on a typical machine; the bench numbers make that
 * visible.
 */

import { bench, describe } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
} from '@filigree/core';
import { fromJson, type IJsonGraph } from '@filigree/graph';
import { createDefaultForceAlgorithm } from '@filigree/alg-force';

import { randomMesh } from './fixtures.js';

const buildEngine = () => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultForceAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const withForceOptions = (input: IJsonGraph, useBarnesHut: boolean): IJsonGraph => ({
  ...input,
  layoutOptions: {
    ...input.layoutOptions,
    'elk.algorithm': 'force',
    'elk.force.useBarnesHut': useBarnesHut,
  },
});

const runForce = async (json: IJsonGraph, useBarnesHut: boolean): Promise<void> => {
  const graph = fromJson(withForceOptions(json, useBarnesHut));
  await buildEngine().layout(graph);
};

describe('force: 30 nodes / 90 edges', () => {
  const json = randomMesh(30, 3);
  bench('exact O(n²) repulsion', async () => {
    await runForce(json, false);
  });
  bench('Barnes-Hut θ=0.7', async () => {
    await runForce(json, true);
  });
});

describe('force: 80 nodes / 240 edges', () => {
  const json = randomMesh(80, 3);
  bench('exact O(n²) repulsion', async () => {
    await runForce(json, false);
  });
  bench('Barnes-Hut θ=0.7', async () => {
    await runForce(json, true);
  });
});

describe('force: 200 nodes / 600 edges', () => {
  const json = randomMesh(200, 3);
  bench('exact O(n²) repulsion', async () => {
    await runForce(json, false);
  });
  bench('Barnes-Hut θ=0.7', async () => {
    await runForce(json, true);
  });
});
