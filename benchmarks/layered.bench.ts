/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Layered-algorithm benchmarks.
 *
 * Two axes:
 *   - graph shape (chain / grid / random DAG)
 *   - graph size  (small / medium / large)
 *
 * Each `bench()` block lays out a fresh `fromJson` graph end-to-end via
 * the default layered composition. Re-parsing keeps every iteration
 * independent so we measure the real per-layout cost, including the
 * graph builder.
 */

import { bench, describe } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
} from '@benkalegin/filigree-core';
import { fromJson } from '@benkalegin/filigree-graph';
import { createDefaultLayeredAlgorithm } from '@benkalegin/filigree-alg-layered';

import { chain, grid, randomDag } from './fixtures.js';

const buildEngine = () => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const runLayered = async (json: ReturnType<typeof chain>): Promise<void> => {
  const graph = fromJson({
    ...json,
    layoutOptions: { ...json.layoutOptions, 'elk.algorithm': 'layered' },
  });
  await buildEngine().layout(graph);
};

describe('layered: chain', () => {
  const small = chain(10);
  const medium = chain(50);
  const large = chain(200);
  bench('chain 10', async () => {
    await runLayered(small);
  });
  bench('chain 50', async () => {
    await runLayered(medium);
  });
  bench('chain 200', async () => {
    await runLayered(large);
  });
});

describe('layered: grid', () => {
  const small = grid(4, 4);
  const medium = grid(8, 8);
  const large = grid(12, 12);
  bench('grid 4x4', async () => {
    await runLayered(small);
  });
  bench('grid 8x8', async () => {
    await runLayered(medium);
  });
  bench('grid 12x12', async () => {
    await runLayered(large);
  });
});

describe('layered: random DAG', () => {
  const small = randomDag(20, 0.15);
  const medium = randomDag(60, 0.08);
  const large = randomDag(150, 0.04);
  bench('randomDag n=20 density=0.15', async () => {
    await runLayered(small);
  });
  bench('randomDag n=60 density=0.08', async () => {
    await runLayered(medium);
  });
  bench('randomDag n=150 density=0.04', async () => {
    await runLayered(large);
  });
});
