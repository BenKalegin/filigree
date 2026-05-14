/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @filigree/render-svg.
 */

export { renderSvg } from './render-svg.js';
export { SvgRenderer } from './svg-renderer.js';
export {
  type IRenderOptions,
  DEFAULT_RENDER_OPTIONS,
  mergeRenderOptions,
} from './render-options.js';
export { escapeXml } from './escape-xml.js';
