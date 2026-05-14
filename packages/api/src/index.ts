/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of `@filigree/api`.
 *
 * Single import for the common case: parse a JSON graph, lay it out, render
 * to SVG. Power users can still import the underlying packages directly to
 * compose a custom engine or register additional algorithms.
 */

export { layout, type ILayoutOptions } from './layout.js';

// Re-exports so callers don't need to know about the package layout
// for the basics. Anything not re-exported here is still available
// from its origin package.
export {
  type ElkGraph,
  type ElkNode,
  type ElkEdge,
  type ElkPort,
  type ElkLabel,
  type IGraph,
  type INode,
  type IEdge,
  type IPort,
  type ILabel,
  type IJsonGraph,
  type IJsonNode,
  type IJsonEdge,
  type IJsonPort,
  type IJsonLabel,
  fromJson,
  toJson,
  GraphFactory,
} from '@filigree/graph';

export {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  CompoundPaddingOption,
  AlgorithmOption,
  type ILayoutEngine,
  type IAlgorithmRegistry,
  type IOption,
  type IOptionResolver,
} from '@filigree/core';

export {
  renderSvg,
  type IRenderOptions,
  type INodeStyleOverride,
  type IEdgeStyleOverride,
} from '@filigree/render-svg';

export { LAYERED_ALGORITHM_ID } from '@filigree/alg-layered';
export { FORCE_ALGORITHM_ID } from '@filigree/alg-force';
