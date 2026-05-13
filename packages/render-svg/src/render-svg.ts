/**
 * Public entry: render a laid-out `IGraph` to a self-contained SVG string.
 */

import { type IGraph } from '@filigree/graph';

import { mergeRenderOptions, type IRenderOptions } from './render-options.js';
import { SvgRenderer } from './svg-renderer.js';

export const renderSvg = (graph: IGraph, overrides: Partial<IRenderOptions> = {}): string => {
  const options = mergeRenderOptions(overrides);
  return new SvgRenderer(options).render(graph);
};
