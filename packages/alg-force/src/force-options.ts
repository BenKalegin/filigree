/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Tunables for the force-directed algorithm.
 *
 * Conservative defaults sized for graphs of ~10–50 nodes. Hosts override via
 * graph-level layout options reading these `IOption`s through the resolver.
 */

import { defineProperty } from '@benkalegin/filigree-graph';
import { type IOption, OptionScope } from '@benkalegin/filigree-core';

const DEFAULT_ITERATIONS = 100;
const DEFAULT_AREA = 90_000;
const DEFAULT_IDEAL_LENGTH = 80;
const DEFAULT_USE_BARNES_HUT = false;
const DEFAULT_BARNES_HUT_THETA = 0.7;
const AREA_DESC = 'Approximate bounding-box area used to derive the ideal edge length.';
const IDEAL_DESC = 'Starting target for the spring rest-length; overrides the area-derived value.';
const BH_DESC = 'Approximate pairwise repulsion with a quadtree (O(n log n)) instead of O(n²).';
const THETA_DESC = 'Region-size to distance ratio below which a region is approximated.';

export const ForceOptions = {
  iterations: {
    property: defineProperty<number>({
      id: 'elk.force.iterations',
      defaultValue: DEFAULT_ITERATIONS,
    }),
    name: 'Iterations',
    description: 'Number of force-simulation iterations.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  area: {
    property: defineProperty<number>({
      id: 'elk.force.area',
      defaultValue: DEFAULT_AREA,
    }),
    name: 'Target area',
    description: AREA_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  idealLength: {
    property: defineProperty<number>({
      id: 'elk.force.idealLength',
      defaultValue: DEFAULT_IDEAL_LENGTH,
    }),
    name: 'Ideal edge length',
    description: IDEAL_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  useBarnesHut: {
    property: defineProperty<boolean>({
      id: 'elk.force.useBarnesHut',
      defaultValue: DEFAULT_USE_BARNES_HUT,
    }),
    name: 'Use Barnes-Hut',
    description: BH_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<boolean>,

  barnesHutTheta: {
    property: defineProperty<number>({
      id: 'elk.force.barnesHutTheta',
      defaultValue: DEFAULT_BARNES_HUT_THETA,
    }),
    name: 'Barnes-Hut theta',
    description: THETA_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
