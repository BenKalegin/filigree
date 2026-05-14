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
 * of properties, plus per-element callback hooks (`nodeStyle`, `edgeStyle`)
 * for theming individual nodes or edges based on their data.
 */

import { type IEdge, type INode } from '@filigree/graph';

export interface INodeStyleOverride {
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly cornerRadius?: number;
  readonly strokeDasharray?: string;
}

export interface IEdgeStyleOverride {
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeDasharray?: string;
}

export interface IRenderOptions {
  readonly padding: number;
  readonly nodeFill: string;
  readonly nodeStroke: string;
  readonly nodeStrokeWidth: number;
  readonly nodeCornerRadius: number;
  readonly edgeStroke: string;
  readonly edgeStrokeWidth: number;
  /**
   * SVG `stroke-dasharray` applied to every edge unless overridden by
   * `edgeStyle`. `undefined` (default) renders solid edges. Common
   * pattern: `'4 3'` for a short-dash dashed look.
   */
  readonly edgeStrokeDasharray: string | undefined;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly textColor: string;
  /**
   * Optional fill behind every label. Useful when edges pass under text or
   * when labels overflow a narrow node. `undefined` (the default) renders
   * labels with no backing rect.
   */
  readonly labelBackground: string | undefined;
  /**
   * Optional per-node theming hook. Called for each rendered node; the
   * returned override merges onto the global node defaults. Return
   * `undefined` (or omit fields) to fall back to the default style.
   */
  readonly nodeStyle: ((node: INode) => INodeStyleOverride | undefined) | undefined;
  /**
   * Optional per-edge theming hook. Called for each rendered edge; the
   * returned override merges onto the global edge defaults.
   */
  readonly edgeStyle: ((edge: IEdge) => IEdgeStyleOverride | undefined) | undefined;
}

export const DEFAULT_RENDER_OPTIONS: IRenderOptions = {
  padding: 12,
  nodeFill: '#ffffff',
  nodeStroke: '#1f2937',
  nodeStrokeWidth: 1.5,
  nodeCornerRadius: 4,
  edgeStroke: '#374151',
  edgeStrokeWidth: 1.5,
  edgeStrokeDasharray: undefined,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  textColor: '#111827',
  labelBackground: undefined,
  nodeStyle: undefined,
  edgeStyle: undefined,
};

export const mergeRenderOptions = (overrides: Partial<IRenderOptions>): IRenderOptions => ({
  ...DEFAULT_RENDER_OPTIONS,
  ...overrides,
});
