import { describe, expect, it } from 'vitest';

import { InvalidGraphError } from '../src/errors.js';
import { fromJson } from '../src/json/from-json.js';
import { type IJsonGraph } from '../src/json/types.js';
import { toJson } from '../src/json/to-json.js';
import { toPropertyId } from '../src/property-id.js';

describe('fromJson', () => {
  it('parses a flat graph with two nodes and an edge', () => {
    const json: IJsonGraph = {
      id: 'root',
      children: [
        { id: 'n1', width: 30, height: 30 },
        { id: 'n2', width: 30, height: 30 },
      ],
      edges: [{ id: 'e1', sources: ['n1'], targets: ['n2'] }],
    };
    const graph = fromJson(json);
    expect(graph.children).toHaveLength(2);
    expect(graph.containedEdges).toHaveLength(1);
    expect(graph.containedEdges[0]?.sources[0]?.id).toBe('n1');
    expect(graph.containedEdges[0]?.targets[0]?.id).toBe('n2');
  });

  it('parses a node with ports and resolves port-typed edges', () => {
    const json: IJsonGraph = {
      id: 'root',
      children: [
        { id: 'n1', ports: [{ id: 'n1.p1' }] },
        { id: 'n2', ports: [{ id: 'n2.p1' }] },
      ],
      edges: [{ id: 'e1', sources: ['n1.p1'], targets: ['n2.p1'] }],
    };
    const graph = fromJson(json);
    expect(graph.containedEdges[0]?.sources[0]?.id).toBe('n1.p1');
  });

  it('parses nested compound graphs', () => {
    const json: IJsonGraph = {
      id: 'root',
      children: [
        {
          id: 'parent',
          children: [{ id: 'inner-a' }, { id: 'inner-b' }],
          edges: [{ id: 'inner-e', sources: ['inner-a'], targets: ['inner-b'] }],
        },
      ],
    };
    const graph = fromJson(json);
    expect(graph.children[0]?.children).toHaveLength(2);
    expect(graph.children[0]?.containedEdges).toHaveLength(1);
  });

  it('preserves layoutOptions on every element', () => {
    const json: IJsonGraph = {
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'layered' },
      children: [{ id: 'n1', layoutOptions: { 'elk.padding': 8 } }],
    };
    const graph = fromJson(json);
    const algoEntries = new Map(graph.propertyEntries());
    expect(algoEntries.get(toPropertyId('elk.algorithm'))).toBe('layered');
    const nodeEntries = new Map(graph.children[0]?.propertyEntries() ?? []);
    expect(nodeEntries.get(toPropertyId('elk.padding'))).toBe(8);
  });

  it('rejects malformed input', () => {
    expect(() => fromJson(null)).toThrow(InvalidGraphError);
    expect(() => fromJson({})).toThrow(InvalidGraphError);
    expect(() => fromJson({ id: 42 })).toThrow(InvalidGraphError);
  });

  it('rejects unknown endpoint references', () => {
    const json: IJsonGraph = {
      id: 'root',
      children: [{ id: 'n1' }],
      edges: [{ id: 'e1', sources: ['n1'], targets: ['missing'] }],
    };
    expect(() => fromJson(json)).toThrow(InvalidGraphError);
  });

  it('rejects duplicate ids', () => {
    const json: IJsonGraph = {
      id: 'root',
      children: [{ id: 'dup' }, { id: 'dup' }],
    };
    expect(() => fromJson(json)).toThrow(InvalidGraphError);
  });
});

describe('toJson + fromJson round-trip', () => {
  it('preserves structure for a flowchart-shaped graph', () => {
    const original: IJsonGraph = {
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN' },
      children: [
        { id: 'start', width: 40, height: 40, labels: [{ text: 'Start' }] },
        { id: 'decision', width: 60, height: 40, labels: [{ text: '?' }] },
        { id: 'end', width: 40, height: 40, labels: [{ text: 'End' }] },
      ],
      edges: [
        { id: 'e1', sources: ['start'], targets: ['decision'] },
        { id: 'e2', sources: ['decision'], targets: ['end'], labels: [{ text: 'yes' }] },
      ],
    };
    const roundTripped = toJson(fromJson(original));
    expect(roundTripped.children).toHaveLength(3);
    expect(roundTripped.edges).toHaveLength(2);
    expect(roundTripped.layoutOptions).toEqual({
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
    });
    expect(roundTripped.children?.[1]?.labels?.[0]?.text).toBe('?');
  });
});
