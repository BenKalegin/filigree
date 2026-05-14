/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Pure bend-point math for the two-bend orthogonal router.
 *
 * Two routes:
 *
 *   - `bendsBetween(start, end, lateralOffset)`: classic 2-bend route between
 *     a source anchor and a target anchor, with an optional lateral offset
 *     for parallel-edge separation.
 *   - `bendsThroughWaypoints(start, waypoints, end)`: chains multiple
 *     `bendsBetween` calls together so a long edge can thread through
 *     dummy-node positions.
 */

import { type IPoint } from '@benkalegin/filigree-graph';

const PARALLEL_DETOUR_Y_MARGIN = 0.2;

export const bendsBetween = (
  start: IPoint,
  end: IPoint,
  lateralOffset: number,
): readonly IPoint[] => {
  if (start.x === end.x) {
    if (lateralOffset === 0) return [];
    return detourSameColumn(start, end, lateralOffset);
  }
  const midY = (start.y + end.y) / 2 + lateralOffset;
  return [
    { x: start.x, y: midY },
    { x: end.x, y: midY },
  ];
};

export const bendsThroughWaypoints = (
  start: IPoint,
  waypoints: readonly IPoint[],
  end: IPoint,
): readonly IPoint[] => {
  const all: IPoint[] = [];
  let prev = start;
  for (const next of [...waypoints, end]) {
    all.push(...bendsBetween(prev, next, 0));
    prev = next;
  }
  return all;
};

const detourSameColumn = (start: IPoint, end: IPoint, lateralOffset: number): readonly IPoint[] => {
  const sideX = start.x + lateralOffset;
  const yMargin = Math.abs(end.y - start.y) * PARALLEL_DETOUR_Y_MARGIN;
  const goingUp = start.y > end.y;
  const startNear = goingUp ? start.y - yMargin : start.y + yMargin;
  const endNear = goingUp ? end.y + yMargin : end.y - yMargin;
  return [
    { x: start.x, y: startNear },
    { x: sideX, y: startNear },
    { x: sideX, y: endNear },
    { x: end.x, y: endNear },
  ];
};
