/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Options the rectpacking algorithm reads at runtime.
 */

import { defineProperty } from '@benkalegin/filigree-graph';
import { type IOption, OptionScope } from '@benkalegin/filigree-core';

const DEFAULT_NODE_GAP = 10;
const DEFAULT_ASPECT_RATIO = 1.6;
const NODE_GAP_DESC = 'Pixel gap between adjacent rectangles, within a row and between rows.';
const ASPECT_RATIO_DESC = 'Desired width / height ratio of the packed bounding box.';

export const RectPackingOptions = {
  nodeGap: {
    property: defineProperty<number>({
      id: 'elk.rectpacking.spacing.node',
      defaultValue: DEFAULT_NODE_GAP,
    }),
    name: 'Node spacing',
    description: NODE_GAP_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,

  aspectRatio: {
    property: defineProperty<number>({
      id: 'elk.rectpacking.aspectRatio',
      defaultValue: DEFAULT_ASPECT_RATIO,
    }),
    name: 'Target aspect ratio',
    description: ASPECT_RATIO_DESC,
    scopes: new Set([OptionScope.Graph]),
  } satisfies IOption<number>,
} as const;
