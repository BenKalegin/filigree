/**
 * Options the radial algorithm reads at runtime.
 */

import { defineProperty } from '@filigree/graph';
import { type IOption, OptionScope } from '@filigree/core';

const DEFAULT_RADIUS_INCREMENT = 100;

export const RadialOptions = {
  radiusIncrement: {
    property: defineProperty<number>({
      id: 'elk.radial.spacing.radius',
      defaultValue: DEFAULT_RADIUS_INCREMENT,
    }),
    name: 'Radius increment',
    description: 'Distance between successive concentric circles.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
