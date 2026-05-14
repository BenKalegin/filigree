/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Shared adjacency-list helpers used by the context builder and any phase
 * that needs to rewrite the predecessor/successor maps (e.g. cycle breaking).
 */

import { type LNode } from './l-node.js';

/**
 * Append `value` to `map[key]`, allocating the list if absent. Duplicate
 * appends are silently ignored — the multi-graph case (two edges between the
 * same pair of nodes) is collapsed for layout purposes.
 */
export const appendUnique = (map: Map<LNode, LNode[]>, key: LNode, value: LNode): void => {
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, [value]);
    return;
  }
  if (!existing.includes(value)) {
    existing.push(value);
  }
};
