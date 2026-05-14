/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

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

export const RADIAL_TREE: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'radial' },
  children: [
    { id: 'core', width: 50, height: 50, labels: [{ text: 'Core' }] },
    { id: 'api', width: 50, height: 40, labels: [{ text: 'API' }] },
    { id: 'ui', width: 50, height: 40, labels: [{ text: 'UI' }] },
    { id: 'data', width: 50, height: 40, labels: [{ text: 'Data' }] },
    { id: 'auth', width: 50, height: 40, labels: [{ text: 'Auth' }] },
    { id: 'http', width: 40, height: 30, labels: [{ text: 'HTTP' }] },
    { id: 'graphql', width: 60, height: 30, labels: [{ text: 'GraphQL' }] },
    { id: 'web', width: 40, height: 30, labels: [{ text: 'Web' }] },
    { id: 'mobile', width: 50, height: 30, labels: [{ text: 'Mobile' }] },
    { id: 'sql', width: 40, height: 30, labels: [{ text: 'SQL' }] },
    { id: 'cache', width: 50, height: 30, labels: [{ text: 'Cache' }] },
  ],
  edges: [
    { id: 'c_api', sources: ['core'], targets: ['api'] },
    { id: 'c_ui', sources: ['core'], targets: ['ui'] },
    { id: 'c_data', sources: ['core'], targets: ['data'] },
    { id: 'c_auth', sources: ['core'], targets: ['auth'] },
    { id: 'api_http', sources: ['api'], targets: ['http'] },
    { id: 'api_gql', sources: ['api'], targets: ['graphql'] },
    { id: 'ui_web', sources: ['ui'], targets: ['web'] },
    { id: 'ui_mob', sources: ['ui'], targets: ['mobile'] },
    { id: 'data_sql', sources: ['data'], targets: ['sql'] },
    { id: 'data_cache', sources: ['data'], targets: ['cache'] },
  ],
};

// Fan-out + fan-in. A dispatcher feeds five tasks, every task reports to
// a single collector. Useful for showing a `Group` hint clustering a
// subset of the tasks together.
export const FAN_OUT: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'dispatcher', width: 100, height: 40, labels: [{ text: 'Dispatcher' }] },
    { id: 'task_a', width: 70, height: 30, labels: [{ text: 'Task A' }] },
    { id: 'task_b', width: 70, height: 30, labels: [{ text: 'Task B' }] },
    { id: 'task_c', width: 70, height: 30, labels: [{ text: 'Task C' }] },
    { id: 'task_d', width: 70, height: 30, labels: [{ text: 'Task D' }] },
    { id: 'task_e', width: 70, height: 30, labels: [{ text: 'Task E' }] },
    { id: 'collector', width: 100, height: 40, labels: [{ text: 'Collector' }] },
  ],
  edges: [
    { id: 'd_a', sources: ['dispatcher'], targets: ['task_a'] },
    { id: 'd_b', sources: ['dispatcher'], targets: ['task_b'] },
    { id: 'd_c', sources: ['dispatcher'], targets: ['task_c'] },
    { id: 'd_d', sources: ['dispatcher'], targets: ['task_d'] },
    { id: 'd_e', sources: ['dispatcher'], targets: ['task_e'] },
    { id: 'a_c', sources: ['task_a'], targets: ['collector'] },
    { id: 'b_c', sources: ['task_b'], targets: ['collector'] },
    { id: 'c_c', sources: ['task_c'], targets: ['collector'] },
    { id: 'd_col', sources: ['task_d'], targets: ['collector'] },
    { id: 'e_c', sources: ['task_e'], targets: ['collector'] },
  ],
};

// Two branches of unequal length sharing a root. Without hints the right
// branch's leaf lands one layer below the left branch's leaf. A SameLayer
// hint can pull them into the same row.
export const UNEVEN_BRANCHES: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'a', width: 60, height: 30, labels: [{ text: 'Start' }] },
    { id: 'b', width: 60, height: 30, labels: [{ text: 'Quick' }] },
    { id: 'c', width: 60, height: 30, labels: [{ text: 'Plan' }] },
    { id: 'd', width: 60, height: 30, labels: [{ text: 'Build' }] },
    { id: 'left_leaf', width: 60, height: 30, labels: [{ text: 'Done A' }] },
    { id: 'right_leaf', width: 60, height: 30, labels: [{ text: 'Done B' }] },
  ],
  edges: [
    { id: 'ab', sources: ['a'], targets: ['b'] },
    { id: 'ac', sources: ['a'], targets: ['c'] },
    { id: 'b_l', sources: ['b'], targets: ['left_leaf'] },
    { id: 'cd', sources: ['c'], targets: ['d'] },
    { id: 'd_r', sources: ['d'], targets: ['right_leaf'] },
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
