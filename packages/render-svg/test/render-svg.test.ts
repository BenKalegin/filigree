/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';
import { fromJson, type IJsonGraph } from '@filigree/graph';

import { renderSvg } from '../src/render-svg.js';

const layoutMockSimple = (): IJsonGraph => ({
  id: 'root',
  width: 200,
  height: 200,
  children: [
    { id: 'a', x: 0, y: 0, width: 40, height: 30 },
    { id: 'b', x: 0, y: 80, width: 40, height: 30 },
  ],
  edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
});

const noOverride = (): undefined => undefined;

describe('renderSvg', () => {
  it('emits a valid <svg> root element with width / height / viewBox', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph);
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0');
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('emits an arrow marker definition in <defs>', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<marker');
    expect(svg).toContain('id="elk-ts-arrow"');
  });

  it('emits a <rect> for each node and a <polyline> for the edge', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph);
    const rects = svg.match(/<rect /gu);
    const polylines = svg.match(/<polyline /gu);
    expect(rects?.length).toBe(2);
    expect(polylines?.length).toBe(1);
  });

  it('positions each node group with a translate matching its (x, y)', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph);
    expect(svg).toContain('translate(0, 0)');
    expect(svg).toContain('translate(0, 80)');
  });

  it('renders compound nodes as nested <g> with their own translate', () => {
    const graph = fromJson({
      id: 'root',
      width: 200,
      height: 200,
      children: [
        {
          id: 'group',
          x: 10,
          y: 20,
          width: 80,
          height: 60,
          children: [{ id: 'inner', x: 0, y: 0, width: 30, height: 20 }],
        },
      ],
    });
    const svg = renderSvg(graph);
    // Outer group translates to (10, 20).
    expect(svg).toContain('translate(10, 20)');
    // Inner node translates to (0, 0) within its compound.
    const groupTransformIndex = svg.indexOf('translate(10, 20)');
    const innerTransformIndex = svg.indexOf('translate(0, 0)', groupTransformIndex);
    expect(innerTransformIndex).toBeGreaterThan(groupTransformIndex);
  });

  it('escapes XML special characters in label text', () => {
    const graph = fromJson({
      id: 'root',
      width: 100,
      height: 100,
      children: [{ id: 'n', x: 0, y: 0, width: 40, height: 30, labels: [{ text: 'A & <B>' }] }],
    });
    const svg = renderSvg(graph);
    expect(svg).toContain('A &amp; &lt;B&gt;');
    expect(svg).not.toContain('<B>');
  });

  it('uses provided render-option overrides', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, { nodeStroke: '#ff0000', edgeStroke: '#00ff00' });
    expect(svg).toContain('stroke="#ff0000"');
    expect(svg).toContain('stroke="#00ff00"');
  });

  it('honors nodeCornerRadius', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, { nodeCornerRadius: 0 });
    expect(svg).toContain('rx="0"');
    expect(svg).not.toContain('rx="4"');
  });

  it('applies edgeStrokeDasharray to every edge by default', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, { edgeStrokeDasharray: '4 3' });
    expect(svg).toContain('stroke-dasharray="4 3"');
  });

  it('emits no stroke-dasharray when the option is undefined', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph);
    expect(svg).not.toContain('stroke-dasharray');
  });

  it('per-node nodeStyle callback overrides fill / cornerRadius / dash', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, {
      nodeStyle: (node) =>
        node.id === 'a'
          ? { fill: '#fef3c7', cornerRadius: 12, strokeDasharray: '2 2' }
          : undefined,
    });
    expect(svg).toContain('fill="#fef3c7"');
    expect(svg).toContain('rx="12"');
    // The dasharray applies only to node 'a' — node 'b' stays default (no dash).
    const aRect = /<rect [^>]*fill="#fef3c7"[^>]*\/>/u.exec(svg)?.[0] ?? '';
    expect(aRect).toContain('stroke-dasharray="2 2"');
  });

  it('per-edge edgeStyle callback overrides stroke + dasharray', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, {
      edgeStyle: (edge) =>
        edge.id === 'e' ? { stroke: '#dc2626', strokeDasharray: '6 2' } : undefined,
    });
    expect(svg).toContain('stroke="#dc2626"');
    expect(svg).toContain('stroke-dasharray="6 2"');
  });

  it('renders one polyline per routeSegment for hyperedges', () => {
    const graph = fromJson({
      id: 'root',
      width: 200,
      height: 200,
      children: [
        { id: 'a', x: 0, y: 0, width: 30, height: 30 },
        { id: 'b', x: 50, y: 0, width: 30, height: 30 },
        { id: 'merge', x: 25, y: 100, width: 30, height: 30 },
      ],
      edges: [{ id: 'h', sources: ['a', 'b'], targets: ['merge'] }],
    });
    // Simulate router output: three route segments meeting at a junction.
    const h = graph.containedEdges.find((e) => e.id === 'h')!;
    h.setRouteSegments([
      [
        { x: 15, y: 30 },
        { x: 15, y: 60 },
        { x: 40, y: 60 },
      ],
      [
        { x: 65, y: 30 },
        { x: 65, y: 60 },
        { x: 40, y: 60 },
      ],
      [
        { x: 40, y: 60 },
        { x: 40, y: 100 },
      ],
    ]);
    const svg = renderSvg(graph);
    const polylines = svg.match(/<polyline /gu) ?? [];
    expect(polylines.length).toBe(3);
  });

  it('returning undefined from a style callback falls back to defaults', () => {
    const graph = fromJson(layoutMockSimple());
    const svg = renderSvg(graph, {
      nodeStyle: noOverride,
      edgeStyle: noOverride,
    });
    // No overrides at all ⇒ default node fill is present.
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('rx="4"');
  });
});
