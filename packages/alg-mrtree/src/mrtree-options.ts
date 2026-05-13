/**
 * Options the MrTree algorithm reads at runtime.
 */

import { defineProperty } from '@filigree/graph';
import { type IOption, OptionScope } from '@filigree/core';

const DEFAULT_LEVEL_SPACING = 60;
const DEFAULT_SIBLING_SPACING = 30;

export const MrTreeOptions = {
  levelSpacing: {
    property: defineProperty<number>({
      id: 'elk.mrtree.spacing.level',
      defaultValue: DEFAULT_LEVEL_SPACING,
    }),
    name: 'Tree level spacing',
    description: 'Vertical distance between successive tree levels.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  siblingSpacing: {
    property: defineProperty<number>({
      id: 'elk.mrtree.spacing.sibling',
      defaultValue: DEFAULT_SIBLING_SPACING,
    }),
    name: 'Sibling spacing',
    description: 'Horizontal gap between adjacent leaf nodes.',
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
