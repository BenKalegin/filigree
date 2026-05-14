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
 * No edge clipping, no anchor inference at port sides — the renderer draws
 * straight from the source's bottom-center to the first bend point (or to
 * the target's top-center if no bends) and on to the target. Good enough for
 * inspection; a router-aware renderer is a later iteration.
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
import { type IRenderOptions } from './render-options.js';

const ARROW_MARKER_ID = 'elk-ts-arrow';
// SVG `<text>` is anchored at the baseline; nudge down by ~¼ of the font size
// so the visual centerline of the glyphs lines up with the node's y center.
const TEXT_BASELINE_NUDGE_FACTOR = 0.25;
// Rough character-width / font-size ratio for proportional fonts. Used to
// estimate a label's pixel width when emitting a background rect; SVG has
// no built-in measurement and a 10% overestimate is harmless.
const AVERAGE_CHAR_WIDTH_RATIO = 0.6;
const LABEL_BG_HORIZONTAL_PADDING = 4;

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
    const opts = this.options;
    const open = `<g transform="translate(${String(node.x)}, ${String(node.y)})">`;
    const rect =
      `<rect x="0" y="0" width="${String(node.width)}" height="${String(node.height)}" ` +
      `fill="${opts.nodeFill}" stroke="${opts.nodeStroke}" stroke-width="${String(opts.nodeStrokeWidth)}" rx="4"/>`;
    const labels = node.labels.map((l) => this.renderNodeLabel(l.text, node)).join('');
    const inner = this.renderNodeContents(node);
    return [open, rect, labels, inner, '</g>'].filter((s) => s.length > 0).join('\n');
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
    if (opts.labelBackground === undefined) {
      return '';
    }
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
    if (node.children.length === 0) {
      return node.height / 2 + baselineNudge;
    }
    return opts.fontSize + baselineNudge;
  }

  private renderEdge(edge: IEdge, container: INode): string {
    const opts = this.options;
    const points = this.computeEdgePoints(edge, container);
    if (points === undefined) {
      return '';
    }
    const attr = points.map((p) => `${String(p.x)},${String(p.y)}`).join(' ');
    return (
      `<polyline points="${attr}" fill="none" stroke="${opts.edgeStroke}" ` +
      `stroke-width="${String(opts.edgeStrokeWidth)}" marker-end="url(#${ARROW_MARKER_ID})"/>`
    );
  }

  private computeEdgePoints(
    edge: IEdge,
    container: INode,
  ): readonly { x: number; y: number }[] | undefined {
    const resolved = resolveSimpleEdge(edge, container);
    if (resolved === undefined) {
      return undefined;
    }
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
  if (sourceEndpoint === undefined || targetEndpoint === undefined) {
    return undefined;
  }
  if (moreSources.length > 0 || moreTargets.length > 0) {
    return undefined;
  }
  const sourceOwner = resolveOwner(sourceEndpoint, container);
  const targetOwner = resolveOwner(targetEndpoint, container);
  if (sourceOwner === undefined || targetOwner === undefined) {
    return undefined;
  }
  return { sourceEndpoint, sourceOwner, targetEndpoint, targetOwner };
};

const resolveOwner = (endpoint: IEdgeEndpoint, container: INode): INode | undefined => {
  if (isNode(endpoint)) {
    return endpoint;
  }
  return container.children.find((child) => child.ports.some((p) => p.id === endpoint.id));
};
