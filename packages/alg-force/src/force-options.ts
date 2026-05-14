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

import { defineProperty } from '@filigree/graph';
import { type IOption, OptionScope } from '@filigree/core';

const DEFAULT_ITERATIONS = 100;
const DEFAULT_AREA = 90_000;
const DEFAULT_IDEAL_LENGTH = 80;

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
    description: 'Approximate bounding-box area used to derive the ideal edge length.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  idealLength: {
    property: defineProperty<number>({
      id: 'elk.force.idealLength',
      defaultValue: DEFAULT_IDEAL_LENGTH,
    }),
    name: 'Ideal edge length',
    description: 'Starting target for the spring rest-length; overrides the area-derived value.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
