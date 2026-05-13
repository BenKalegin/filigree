/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Layout-options accessor that lets algorithms read hints attached to a graph.
 *
 * Hints attached via `attachHints(graph, [...])` show up under this option;
 * algorithms that know how to honor a specific `HintKind` filter the list
 * by kind and apply each one. Algorithms that don't recognize a hint kind
 * simply ignore it — hints are soft constraints, not hard preconditions.
 */

import { defineProperty, type IPropertyHolder } from '@filigree/graph';

import { type IHint } from './i-hint.js';

const HINTS_PROPERTY_ID = 'filigree.hints';
const NO_HINTS: readonly IHint[] = [];

const HintsProperty = defineProperty<readonly IHint[]>({
  id: HINTS_PROPERTY_ID,
  defaultValue: NO_HINTS,
});

export const attachHints = (holder: IPropertyHolder, hints: readonly IHint[]): void => {
  holder.setProperty(HintsProperty, hints);
};

export const getHints = (holder: IPropertyHolder): readonly IHint[] => {
  return holder.getProperty(HintsProperty);
};
