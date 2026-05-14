/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Options the layered algorithm reads at runtime.
 *
 * Lives next to the algorithm — algorithms own their option schemas instead
 * of declaring them in a central registry. This is the SOLID Open/Closed
 * payoff: adding a new algorithm doesn't touch core, only its own module.
 */

import { defineProperty } from '@benkalegin/filigree-graph';
import { type IOption, OptionScope } from '@benkalegin/filigree-core';

const DEFAULT_NODE_NODE_SPACING = 40;
const DEFAULT_LAYER_SPACING = 80;
const DEFAULT_PARALLEL_EDGE_OFFSET = 20;

export const LayeredOptions = {
  spacingNodeNode: {
    property: defineProperty<number>({
      id: 'elk.layered.spacing.nodeNode',
      defaultValue: DEFAULT_NODE_NODE_SPACING,
    }),
    name: 'Node-to-node spacing within a layer',
    description: 'Horizontal distance between adjacent nodes inside the same layer.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  spacingLayer: {
    property: defineProperty<number>({
      id: 'elk.layered.spacing.layer',
      defaultValue: DEFAULT_LAYER_SPACING,
    }),
    name: 'Layer-to-layer spacing',
    description: 'Vertical distance between adjacent layers.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  parallelEdgeOffset: {
    property: defineProperty<number>({
      id: 'elk.layered.spacing.parallelEdge',
      defaultValue: DEFAULT_PARALLEL_EDGE_OFFSET,
    }),
    name: 'Parallel-edge offset',
    description: 'Lateral spacing between edges that share an endpoint pair.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
