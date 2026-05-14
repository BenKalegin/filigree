/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Renders a laid-out `IGraph` to a self-contained SVG string.
 *
 * Hierarchy is expressed via nested `<g transform="translate(x, y)">` groups
 * — children inside a compound are positioned in the compound's local
 * coordinate system, exactly as ELK lays them out, so we just push a
 * translate for each level.
 *
 * Styling is layered: a set of global defaults from `IRenderOptions` defines
 * fills/strokes/widths, and an optional per-element callback (`nodeStyle`
 * / `edgeStyle`) returns overrides for individual elements. This is enough
 * to drive both "single-theme" rendering and data-driven (e.g. node-kind
 * specific) styling without changing the renderer.
 */

import {
  EdgeAnchorSide,
  endpointAnchor,
  type IEdge,
  type IEdgeEndpoint,
  type IGraph,
  type INode,
  isNode,
} from '@filigree/graph';

import { escapeXml } from './escape-xml.js';
import {
  type IEdgeStyleOverride,
  type INodeStyleOverride,
  type IRenderOptions,
} from './render-options.js';

const ARROW_MARKER_ID = 'elk-ts-arrow';
const TEXT_BASELINE_NUDGE_FACTOR = 0.25;
const AVERAGE_CHAR_WIDTH_RATIO = 0.6;
const LABEL_BG_HORIZONTAL_PADDING = 4;

interface IResolvedNodeStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly cornerRadius: number;
  readonly strokeDasharray: string | undefined;
}

interface IResolvedEdgeStyle {
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly strokeDasharray: string | undefined;
}

export class SvgRenderer {
  constructor(private readonly options: IRenderOptions) {}

  public render(graph: IGraph): string {
    const width = graph.width + this.options.padding * 2;
    const height = graph.height + this.options.padding * 2;
    return [
      this.openSvg(width, height),
      this.renderDefs(),
      `<g transform="translate(${String(this.options.padding)}, ${String(this.options.padding)})">`,
      this.renderNodeContents(graph),
      '</g>',
      '</svg>',
    ].join('\n');
  }

  private openSvg(width: number, height: number): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" ` +
      `height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">`
    );
  }

  private renderDefs(): string {
    return [
      '<defs>',
      `<marker id="${ARROW_MARKER_ID}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">`,
      `<path d="M0,0 L0,6 L9,3 z" fill="${this.options.edgeStroke}"/>`,
      '</marker>',
      '</defs>',
    ].join('');
  }

  private renderNodeContents(node: INode): string {
    const childSvgs = node.children.map((child) => this.renderNode(child)).join('\n');
    const edgeSvgs = node.containedEdges.map((edge) => this.renderEdge(edge, node)).join('\n');
    return [childSvgs, edgeSvgs].filter((s) => s.length > 0).join('\n');
  }

  private renderNode(node: INode): string {
    const open = `<g transform="translate(${String(node.x)}, ${String(node.y)})">`;
    const style = this.resolveNodeStyle(node);
    const rect =
      `<rect x="0" y="0" width="${String(node.width)}" height="${String(node.height)}" ` +
      `fill="${style.fill}" stroke="${style.stroke}" stroke-width="${String(style.strokeWidth)}" ` +
      `rx="${String(style.cornerRadius)}"${dasharrayAttr(style.strokeDasharray)}/>`;
    const labels = node.labels.map((l) => this.renderNodeLabel(l.text, node)).join('');
    const inner = this.renderNodeContents(node);
    return [open, rect, labels, inner, '</g>'].filter((s) => s.length > 0).join('\n');
  }

  private resolveNodeStyle(node: INode): IResolvedNodeStyle {
    const opts = this.options;
    const base: IResolvedNodeStyle = {
      fill: opts.nodeFill,
      stroke: opts.nodeStroke,
      strokeWidth: opts.nodeStrokeWidth,
      cornerRadius: opts.nodeCornerRadius,
      strokeDasharray: undefined,
    };
    const override = opts.nodeStyle?.(node);
    return mergeNodeStyle(base, override);
  }

  private renderNodeLabel(text: string, node: INode): string {
    const opts = this.options;
    const cx = node.width / 2;
    const cy = this.labelY(node);
    const background = this.renderLabelBackground(text, cx, cy);
    const textEl =
      `<text x="${String(cx)}" y="${String(cy)}" text-anchor="middle" ` +
      `font-family="${escapeXml(opts.fontFamily)}" font-size="${String(opts.fontSize)}" ` +
      `fill="${opts.textColor}">${escapeXml(text)}</text>`;
    return background + textEl;
  }

  private renderLabelBackground(text: string, cx: number, cy: number): string {
    const opts = this.options;
    if (opts.labelBackground === undefined) return '';
    const textWidth = text.length * opts.fontSize * AVERAGE_CHAR_WIDTH_RATIO;
    const rectW = textWidth + LABEL_BG_HORIZONTAL_PADDING * 2;
    const rectH = opts.fontSize + LABEL_BG_HORIZONTAL_PADDING;
    const rectX = cx - rectW / 2;
    const rectY = cy - opts.fontSize;
    return (
      `<rect x="${String(rectX)}" y="${String(rectY)}" width="${String(rectW)}" ` +
      `height="${String(rectH)}" fill="${opts.labelBackground}" rx="2"/>`
    );
  }

  /**
   * Atomic nodes center their label vertically. Compound nodes pin their label
   * to the top so it doesn't get hidden behind inner children (which draw on
   * top of it later in the SVG).
   */
  private labelY(node: INode): number {
    const opts = this.options;
    const baselineNudge = opts.fontSize * TEXT_BASELINE_NUDGE_FACTOR;
    if (node.children.length === 0) return node.height / 2 + baselineNudge;
    return opts.fontSize + baselineNudge;
  }

  private renderEdge(edge: IEdge, container: INode): string {
    const points = this.computeEdgePoints(edge, container);
    if (points === undefined) return '';
    const style = this.resolveEdgeStyle(edge);
    const attr = points.map((p) => `${String(p.x)},${String(p.y)}`).join(' ');
    return (
      `<polyline points="${attr}" fill="none" stroke="${style.stroke}" ` +
      `stroke-width="${String(style.strokeWidth)}"${dasharrayAttr(style.strokeDasharray)} ` +
      `marker-end="url(#${ARROW_MARKER_ID})"/>`
    );
  }

  private resolveEdgeStyle(edge: IEdge): IResolvedEdgeStyle {
    const opts = this.options;
    const base: IResolvedEdgeStyle = {
      stroke: opts.edgeStroke,
      strokeWidth: opts.edgeStrokeWidth,
      strokeDasharray: opts.edgeStrokeDasharray,
    };
    const override = opts.edgeStyle?.(edge);
    return mergeEdgeStyle(base, override);
  }

  private computeEdgePoints(
    edge: IEdge,
    container: INode,
  ): readonly { x: number; y: number }[] | undefined {
    const resolved = resolveSimpleEdge(edge, container);
    if (resolved === undefined) return undefined;
    const goingDown = resolved.sourceOwner.y <= resolved.targetOwner.y;
    const sourceSide = goingDown ? EdgeAnchorSide.Bottom : EdgeAnchorSide.Top;
    const targetSide = goingDown ? EdgeAnchorSide.Top : EdgeAnchorSide.Bottom;
    const start = endpointAnchor(resolved.sourceEndpoint, resolved.sourceOwner, sourceSide);
    const end = endpointAnchor(resolved.targetEndpoint, resolved.targetOwner, targetSide);
    return [start, ...edge.bendPoints, end];
  }
}

interface IResolvedEdge {
  readonly sourceEndpoint: IEdgeEndpoint;
  readonly sourceOwner: INode;
  readonly targetEndpoint: IEdgeEndpoint;
  readonly targetOwner: INode;
}

const resolveSimpleEdge = (edge: IEdge, container: INode): IResolvedEdge | undefined => {
  const [sourceEndpoint, ...moreSources] = edge.sources;
  const [targetEndpoint, ...moreTargets] = edge.targets;
  if (sourceEndpoint === undefined || targetEndpoint === undefined) return undefined;
  if (moreSources.length > 0 || moreTargets.length > 0) return undefined;
  const sourceOwner = resolveOwner(sourceEndpoint, container);
  const targetOwner = resolveOwner(targetEndpoint, container);
  if (sourceOwner === undefined || targetOwner === undefined) return undefined;
  return { sourceEndpoint, sourceOwner, targetEndpoint, targetOwner };
};

const resolveOwner = (endpoint: IEdgeEndpoint, container: INode): INode | undefined => {
  if (isNode(endpoint)) return endpoint;
  return container.children.find((child) => child.ports.some((p) => p.id === endpoint.id));
};

const dasharrayAttr = (value: string | undefined): string => {
  if (value === undefined) return '';
  return ` stroke-dasharray="${escapeXml(value)}"`;
};

const mergeNodeStyle = (
  base: IResolvedNodeStyle,
  override: INodeStyleOverride | undefined,
): IResolvedNodeStyle => {
  if (override === undefined) return base;
  return {
    fill: override.fill ?? base.fill,
    stroke: override.stroke ?? base.stroke,
    strokeWidth: override.strokeWidth ?? base.strokeWidth,
    cornerRadius: override.cornerRadius ?? base.cornerRadius,
    strokeDasharray: override.strokeDasharray ?? base.strokeDasharray,
  };
};

const mergeEdgeStyle = (
  base: IResolvedEdgeStyle,
  override: IEdgeStyleOverride | undefined,
): IResolvedEdgeStyle => {
  if (override === undefined) return base;
  return {
    stroke: override.stroke ?? base.stroke,
    strokeWidth: override.strokeWidth ?? base.strokeWidth,
    strokeDasharray: override.strokeDasharray ?? base.strokeDasharray,
  };
};
