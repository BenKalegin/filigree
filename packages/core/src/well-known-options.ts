/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Options that the core engine itself reads, independent of any algorithm.
 *
 * Algorithm packages declare their own options in their own modules. These
 * here are the minimum the engine needs to dispatch a layout.
 */

import { defineProperty } from '@filigree/graph';

import { OptionScope } from './enums.js';
import { type IOption } from './i-option.js';

export const AlgorithmOption: IOption<string> = {
  property: defineProperty<string>({ id: 'elk.algorithm', defaultValue: 'layered' }),
  name: 'Layout algorithm',
  description: 'Identifier of the layout algorithm to run for this graph.',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};

const DEFAULT_COMPOUND_PADDING = 20;

/**
 * Padding between a compound node's border and its children. The engine
 * resizes every compound to `children-bbox + 2 × padding` after the
 * algorithm finishes; set this on the root for a uniform value, or on a
 * specific compound to override locally.
 */
export const CompoundPaddingOption: IOption<number> = {
  property: defineProperty<number>({
    id: 'elk.padding',
    defaultValue: DEFAULT_COMPOUND_PADDING,
  }),
  name: 'Compound padding',
  description: 'Distance between a compound node and its children on every side.',
  scopes: new Set([OptionScope.Graph, OptionScope.Node]),
};
