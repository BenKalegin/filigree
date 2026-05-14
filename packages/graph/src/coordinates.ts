/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Structural geometric types shared across the graph model.
 *
 * Operations on these types (intersection, projection, distance, …) live in
 * `@filigree/util-geometry`. This module declares shape only — no functions —
 * so that algorithm consumers can read the graph without pulling in geometry math.
 */

export interface IPoint {
  readonly x: number;
  readonly y: number;
}

export interface IDimensions {
  readonly width: number;
  readonly height: number;
}

export interface IRect extends IPoint, IDimensions {}
