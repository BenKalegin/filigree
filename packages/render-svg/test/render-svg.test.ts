import { describe, expect, it } from 'vitest';
import { fromJson, type IJsonGraph } from '@elk/graph';

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
});
