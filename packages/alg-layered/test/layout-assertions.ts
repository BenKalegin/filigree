/**
 * Relational layout assertions for the layered algorithm tests.
 *
 * Strategy: assert *positional invariants* — "node A is in a later layer than B",
 * "A and B share a layer", "A is left of B" — not pixel-exact coordinates. These
 * survive font-metric and spacing changes and catch real layout regressions:
 * a broken longest-path layerer puts the wrong nodes on the same level; a
 * broken placer reorders columns.
 *
 * The "layer" of a node is inferred from its `y` coordinate, since the layered
 * algorithm with direction=DOWN places later layers at higher y values.
 */

import { type ElkNode } from '@filigree/graph';
import { expect } from 'vitest';

const Y_SAME_LAYER_TOLERANCE = 1;

export const expectLayerAfter = (later: ElkNode, earlier: ElkNode): void => {
  expect(later.y, `${later.id} should be in a later layer than ${earlier.id}`).toBeGreaterThan(
    earlier.y,
  );
};

export const expectSameLayer = (a: ElkNode, b: ElkNode): void => {
  const diff = Math.abs(a.y - b.y);
  expect(
    diff,
    `${a.id} and ${b.id} should share a layer (y=${String(a.y)} vs ${String(b.y)})`,
  ).toBeLessThanOrEqual(Y_SAME_LAYER_TOLERANCE);
};

export const expectBelow = (lower: ElkNode, upper: ElkNode): void => {
  expect(lower.y, `${lower.id} should be below ${upper.id}`).toBeGreaterThan(upper.y);
};

export const expectLeftOf = (left: ElkNode, right: ElkNode): void => {
  expect(left.x, `${left.id} should be left of ${right.id}`).toBeLessThan(right.x);
};

export const expectColumnOrder = (nodes: readonly ElkNode[]): void => {
  for (let i = 1; i < nodes.length; i++) {
    expectLeftOf(nodes[i - 1]!, nodes[i]!);
  }
};

export const expectAllPositioned = (nodes: readonly ElkNode[]): void => {
  for (const node of nodes) {
    expect(Number.isFinite(node.x), `${node.id}.x is not finite`).toBe(true);
    expect(Number.isFinite(node.y), `${node.id}.y is not finite`).toBe(true);
  }
};
