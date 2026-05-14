/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Visual options for the SVG renderer.
 *
 * Conservative defaults that produce readable diagrams without depending on
 * any external stylesheet. Hosts can pass an override object for any subset
 * of properties.
 */

export interface IRenderOptions {
  readonly padding: number;
  readonly nodeFill: string;
  readonly nodeStroke: string;
  readonly nodeStrokeWidth: number;
  readonly edgeStroke: string;
  readonly edgeStrokeWidth: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly textColor: string;
  /**
   * Optional fill behind every label. Useful when edges pass under text or
   * when labels overflow a narrow node. `undefined` (the default) renders
   * labels with no backing rect.
   */
  readonly labelBackground: string | undefined;
}

export const DEFAULT_RENDER_OPTIONS: IRenderOptions = {
  padding: 12,
  nodeFill: '#ffffff',
  nodeStroke: '#1f2937',
  nodeStrokeWidth: 1.5,
  edgeStroke: '#374151',
  edgeStrokeWidth: 1.5,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  textColor: '#111827',
  labelBackground: undefined,
};

export const mergeRenderOptions = (overrides: Partial<IRenderOptions>): IRenderOptions => ({
  ...DEFAULT_RENDER_OPTIONS,
  ...overrides,
});
