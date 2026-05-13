/**
 * Graph fixtures used by `generate-docs.ts` to render the layout examples.
 *
 * Same graphs are reused across multiple algorithm variants where applicable
 * (e.g. the flowchart is rendered with three different node placers).
 */

import { type IJsonGraph } from '@filigree/graph';

export const FLOWCHART: IJsonGraph = {
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
    { id: 'e10', sources: ['validate'], targets: ['output'] },
    { id: 'e11', sources: ['output'], targets: ['end'] },
  ],
};

export const CYCLIC: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'start', width: 60, height: 40, labels: [{ text: 'Start' }] },
    { id: 'check', width: 60, height: 40, labels: [{ text: 'Check' }] },
    { id: 'fix', width: 60, height: 40, labels: [{ text: 'Fix' }] },
    { id: 'done', width: 60, height: 40, labels: [{ text: 'Done' }] },
  ],
  edges: [
    { id: 'a', sources: ['start'], targets: ['check'] },
    { id: 'b', sources: ['check'], targets: ['fix'] },
    { id: 'c', sources: ['fix'], targets: ['check'] }, // back edge
    { id: 'd', sources: ['check'], targets: ['done'] },
  ],
};

export const COMPOUND: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'preamble', width: 80, height: 40, labels: [{ text: 'Preamble' }] },
    {
      id: 'sub_flow',
      width: 0,
      height: 0,
      labels: [{ text: 'Sub-flow' }],
      children: [
        { id: 'inner_a', width: 60, height: 30, labels: [{ text: 'Step A' }] },
        { id: 'inner_b', width: 60, height: 30, labels: [{ text: 'Step B' }] },
        { id: 'inner_c', width: 60, height: 30, labels: [{ text: 'Step C' }] },
      ],
      edges: [
        { id: 'ia', sources: ['inner_a'], targets: ['inner_b'] },
        { id: 'ib', sources: ['inner_b'], targets: ['inner_c'] },
      ],
    },
    { id: 'finale', width: 80, height: 40, labels: [{ text: 'Finale' }] },
  ],
  edges: [
    { id: 'oa', sources: ['preamble'], targets: ['sub_flow'] },
    { id: 'ob', sources: ['sub_flow'], targets: ['finale'] },
  ],
};

export const BIDIRECTIONAL: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'client', width: 80, height: 40, labels: [{ text: 'Client' }] },
    { id: 'server', width: 80, height: 40, labels: [{ text: 'Server' }] },
  ],
  edges: [
    { id: 'req', sources: ['client'], targets: ['server'], labels: [{ text: 'request' }] },
    { id: 'res', sources: ['server'], targets: ['client'], labels: [{ text: 'response' }] },
  ],
};

export const TIGHT_COMPOUND: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.padding': 4 },
  children: [
    { id: 'preamble', width: 80, height: 40, labels: [{ text: 'Preamble' }] },
    {
      id: 'sub_flow',
      width: 0,
      height: 0,
      labels: [{ text: 'Sub-flow' }],
      children: [
        { id: 'inner_a', width: 60, height: 30, labels: [{ text: 'Step A' }] },
        { id: 'inner_b', width: 60, height: 30, labels: [{ text: 'Step B' }] },
      ],
      edges: [{ id: 'ia', sources: ['inner_a'], targets: ['inner_b'] }],
    },
    { id: 'finale', width: 80, height: 40, labels: [{ text: 'Finale' }] },
  ],
  edges: [
    { id: 'oa', sources: ['preamble'], targets: ['sub_flow'] },
    { id: 'ob', sources: ['sub_flow'], targets: ['finale'] },
  ],
};

export const TREE: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'mrtree' },
  children: [
    { id: 'r', width: 80, height: 40, labels: [{ text: 'Project' }] },
    { id: 'frontend', width: 80, height: 40, labels: [{ text: 'Frontend' }] },
    { id: 'backend', width: 80, height: 40, labels: [{ text: 'Backend' }] },
    { id: 'ui', width: 60, height: 30, labels: [{ text: 'UI' }] },
    { id: 'state', width: 60, height: 30, labels: [{ text: 'State' }] },
    { id: 'api', width: 60, height: 30, labels: [{ text: 'API' }] },
    { id: 'db', width: 60, height: 30, labels: [{ text: 'DB' }] },
    { id: 'worker', width: 60, height: 30, labels: [{ text: 'Worker' }] },
  ],
  edges: [
    { id: 'r_fe', sources: ['r'], targets: ['frontend'] },
    { id: 'r_be', sources: ['r'], targets: ['backend'] },
    { id: 'fe_ui', sources: ['frontend'], targets: ['ui'] },
    { id: 'fe_st', sources: ['frontend'], targets: ['state'] },
    { id: 'be_api', sources: ['backend'], targets: ['api'] },
    { id: 'be_db', sources: ['backend'], targets: ['db'] },
    { id: 'be_wk', sources: ['backend'], targets: ['worker'] },
  ],
};

export const ORGANIC: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'force' },
  children: [
    { id: 'a', width: 40, height: 30, labels: [{ text: 'A' }] },
    { id: 'b', width: 40, height: 30, labels: [{ text: 'B' }] },
    { id: 'c', width: 40, height: 30, labels: [{ text: 'C' }] },
    { id: 'd', width: 40, height: 30, labels: [{ text: 'D' }] },
    { id: 'e', width: 40, height: 30, labels: [{ text: 'E' }] },
    { id: 'f', width: 40, height: 30, labels: [{ text: 'F' }] },
  ],
  edges: [
    { id: 'ab', sources: ['a'], targets: ['b'] },
    { id: 'bc', sources: ['b'], targets: ['c'] },
    { id: 'ca', sources: ['c'], targets: ['a'] },
    { id: 'cd', sources: ['c'], targets: ['d'] },
    { id: 'de', sources: ['d'], targets: ['e'] },
    { id: 'ef', sources: ['e'], targets: ['f'] },
    { id: 'fd', sources: ['f'], targets: ['d'] },
  ],
};
