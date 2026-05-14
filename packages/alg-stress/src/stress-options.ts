/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Options the stress algorithm reads at runtime.
 */

import { defineProperty } from '@benkalegin/filigree-graph';
import { type IOption, OptionScope } from '@benkalegin/filigree-core';

const DEFAULT_DESIRED_EDGE_LENGTH = 80;
const DEFAULT_ITERATIONS = 80;
const EDGE_LENGTH_DESC = 'Target Euclidean distance between two graph-adjacent nodes.';
const ITERATIONS_DESC = 'Number of stress-majorization update sweeps.';

export const StressOptions = {
  desiredEdgeLength: {
    property: defineProperty<number>({
      id: 'elk.stress.desiredEdgeLength',
      defaultValue: DEFAULT_DESIRED_EDGE_LENGTH,
    }),
    name: 'Desired edge length',
    description: EDGE_LENGTH_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  iterations: {
    property: defineProperty<number>({
      id: 'elk.stress.iterations',
      defaultValue: DEFAULT_ITERATIONS,
    }),
    name: 'Iteration count',
    description: ITERATIONS_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
