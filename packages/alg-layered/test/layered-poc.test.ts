import { describe, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@elk/core';
import { type ElkNode, fromJson, type IJsonGraph } from '@elk/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { expectAllPositioned, expectLayerAfter, expectSameLayer } from './layout-assertions.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

// A small but representative flowchart:
//
//      start
//        ↓
//      input
//        ↓
//     decision
//       ↙ ↘
//     yes  no
//      ↓    ↓
//   proc_y proc_n
//       ↘ ↙
//       join
//        ↓
//     validate
//        ↓
//      format
//        ↓
//      output
//        ↓
//        end
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

const findById = (graph: { children: readonly ElkNode[] }, id: string): ElkNode => {
  const found = graph.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

describe('layered POC: 12-node flowchart', () => {
  it('positions every node and orders them in topological layers', async () => {
    const graph = fromJson(FLOWCHART);
    await buildEngine().layout(graph);

    const byId = (id: string): ElkNode => findById(graph, id);

    expectAllPositioned(graph.children);

    // Branch siblings share a layer.
    expectSameLayer(byId('yes_branch'), byId('no_branch'));
    expectSameLayer(byId('process_yes'), byId('process_no'));

    // Topological chain: each step is in a strictly later layer than its predecessor.
    expectLayerAfter(byId('input'), byId('start'));
    expectLayerAfter(byId('decision'), byId('input'));
    expectLayerAfter(byId('yes_branch'), byId('decision'));
    expectLayerAfter(byId('no_branch'), byId('decision'));
    expectLayerAfter(byId('process_yes'), byId('yes_branch'));
    expectLayerAfter(byId('process_no'), byId('no_branch'));

    // The join sits below both branches.
    expectLayerAfter(byId('join'), byId('process_yes'));
    expectLayerAfter(byId('join'), byId('process_no'));

    // Tail chain after the merge.
    expectLayerAfter(byId('validate'), byId('join'));
    expectLayerAfter(byId('format'), byId('validate'));
    expectLayerAfter(byId('output'), byId('format'));
    expectLayerAfter(byId('end'), byId('output'));
  });
});
