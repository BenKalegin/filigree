/**
 * Full pipeline integration: build a flowchart in JSON, lay it out with the
 * default layered algorithm, render the result to SVG, then assert the SVG
 * contains every expected element. Catches regressions where layout produces
 * coords the renderer can't represent (NaN, missing dimensions, …).
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { fromJson, type IJsonGraph } from '@filigree/graph';
import { renderSvg } from '@filigree/render-svg';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const FLOWCHART: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'start', width: 80, height: 40, labels: [{ text: 'Start' }] },
    { id: 'input', width: 80, height: 40, labels: [{ text: 'Read input' }] },
    { id: 'decision', width: 100, height: 60, labels: [{ text: 'Valid?' }] },
    { id: 'yes_branch', width: 60, height: 30, labels: [{ text: 'Yes' }] },
    { id: 'no_branch', width: 60, height: 30, labels: [{ text: 'No' }] },
    { id: 'process_yes', width: 100, height: 40, labels: [{ text: 'Process' }] },
    { id: 'process_no', width: 100, height: 40, labels: [{ text: 'Report error' }] },
    { id: 'join', width: 60, height: 30, labels: [{ text: 'Join' }] },
    { id: 'validate', width: 100, height: 40, labels: [{ text: 'Validate' }] },
    { id: 'format', width: 100, height: 40, labels: [{ text: 'Format' }] },
    { id: 'output', width: 80, height: 40, labels: [{ text: 'Write output' }] },
    { id: 'end', width: 80, height: 40, labels: [{ text: 'End' }] },
  ],
  edges: [
    { id: 'e1', sources: ['start'], targets: ['input'] },
    { id: 'e2', sources: ['input'], targets: ['decision'] },
    { id: 'e3', sources: ['decision'], targets: ['yes_branch'] },
    { id: 'e4', sources: ['decision'], targets: ['no_branch'] },
    { id: 'e5', sources: ['yes_branch'], targets: ['process_yes'] },
    { id: 'e6', sources: ['no_branch'], targets: ['process_no'] },
    { id: 'e7', sources: ['process_yes'], targets: ['join'] },
    { id: 'e8', sources: ['process_no'], targets: ['join'] },
    { id: 'e9', sources: ['join'], targets: ['validate'] },
    { id: 'e10', sources: ['validate'], targets: ['format'] },
    { id: 'e11', sources: ['format'], targets: ['output'] },
    { id: 'e12', sources: ['output'], targets: ['end'] },
  ],
};

describe('end-to-end: layout + render', () => {
  it('renders the full 12-node flowchart to SVG with every node and edge present', async () => {
    const graph = fromJson(FLOWCHART);
    await buildEngine().layout(graph);
    const svg = renderSvg(graph);

    // 12 nodes → 12 <rect> elements.
    expect(svg.match(/<rect /gu)?.length).toBe(12);
    // 12 edges → 12 <polyline> elements.
    expect(svg.match(/<polyline /gu)?.length).toBe(12);
    // 12 labels.
    expect(svg.match(/<text /gu)?.length).toBe(12);

    // Every label text appears verbatim in the SVG.
    for (const label of ['Start', 'Read input', 'Valid?', 'Yes', 'No', 'End']) {
      expect(svg).toContain(`>${label}<`);
    }

    // No NaN coords leaked through.
    expect(svg).not.toContain('NaN');
  });
});
