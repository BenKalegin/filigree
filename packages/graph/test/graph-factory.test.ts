/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';

import { CountingIdAllocator } from '../src/counting-id-allocator.js';
import { NodeKind } from '../src/enums.js';
import { InvalidGraphError } from '../src/errors.js';
import { GraphFactory } from '../src/graph-factory.js';
import { toGraphElementId } from '../src/identity.js';

describe('GraphFactory', () => {
  it('builds an empty graph when given just an id', () => {
    const factory = new GraphFactory();
    const graph = factory.createGraph({ id: toGraphElementId('root') });
    expect(graph.id).toBe('root');
    expect(graph.root).toBe(true);
    expect(graph.children).toHaveLength(0);
  });

  it('marks a node as compound when given children', () => {
    const factory = new GraphFactory({ idAllocator: new CountingIdAllocator() });
    const child = factory.createNode({});
    const parent = factory.createNode({ children: [child] });
    expect(parent.kind).toBe(NodeKind.Compound);
    expect(child.kind).toBe(NodeKind.Atomic);
  });

  it('allocates ids when no id and an allocator is configured', () => {
    const factory = new GraphFactory({ idAllocator: new CountingIdAllocator({ prefix: 'n-' }) });
    const a = factory.createNode({});
    const b = factory.createNode({});
    expect(a.id).toBe('n-1');
    expect(b.id).toBe('n-2');
  });

  it('throws when no id and no allocator', () => {
    const factory = new GraphFactory();
    expect(() => factory.createNode({})).toThrow(InvalidGraphError);
  });

  it('builds an edge between two nodes', () => {
    const factory = new GraphFactory({ idAllocator: new CountingIdAllocator() });
    const source = factory.createNode({});
    const target = factory.createNode({});
    const edge = factory.createEdge({ sources: [source], targets: [target] });
    expect(edge.sources[0]).toBe(source);
    expect(edge.targets[0]).toBe(target);
  });
});
