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
 *
 * Hierarchical inheritance: hints attached to a compound's ancestor are
 * visible to sub-layouts. `getHints(node)` aggregates the hints attached
 * to `node` and every ancestor up to the root, which lets a user attach
 * hints once at the root and have them apply to whichever sub-layout
 * happens to contain the referenced ids. Hints that reference unknown
 * ids in a given scope are silently ignored (existing behavior of every
 * hint applicator), so over-inheriting is safe.
 */

import { defineProperty, type INode, type IPropertyHolder } from '@filigree/graph';

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

export const getHints = (node: INode): readonly IHint[] => {
  const aggregated: IHint[] = [];
  let current: INode | null = node;
  while (current !== null) {
    aggregated.push(...current.getProperty(HintsProperty));
    current = current.parent;
  }
  return aggregated;
};
