/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public entry: render a laid-out `IGraph` to a self-contained SVG string.
 */

import { type IGraph } from '@benkalegin/filigree-graph';

import { mergeRenderOptions, type IRenderOptions } from './render-options.js';
import { SvgRenderer } from './svg-renderer.js';

export const renderSvg = (graph: IGraph, overrides: Partial<IRenderOptions> = {}): string => {
  const options = mergeRenderOptions(overrides);
  return new SvgRenderer(options).render(graph);
};
