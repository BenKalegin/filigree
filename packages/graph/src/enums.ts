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
  Polyline = 'polyline',
  Orthogonal = 'orthogonal',
  Splines = 'splines',
}
