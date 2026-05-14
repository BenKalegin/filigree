/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Closed sets of named values used throughout the graph model.
 *
 * Every multi-valued discriminator in this package is an enum here — never an
 * inline string-union type elsewhere. See docs/conventions.md.
 */

export enum NodeKind {
  Atomic = 'atomic',
  Compound = 'compound',
}

export enum PortSide {
  Undefined = 'undefined',
  North = 'north',
  East = 'east',
  South = 'south',
  West = 'west',
}

export enum LayoutDirection {
  Undefined = 'undefined',
  Right = 'right',
  Left = 'left',
  Down = 'down',
  Up = 'up',
}

export enum EdgeRoutingStyle {
  Undefined = 'undefined',
  Off = 'off',
  Polyline = 'polyline',
  Orthogonal = 'orthogonal',
  Splines = 'splines',
}
