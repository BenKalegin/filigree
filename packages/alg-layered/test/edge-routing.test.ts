import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@elk/core';
import { type ElkEdge, fromJson, type IJsonGraph } from '@elk/graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';

const buildEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultLayeredAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const findEdge = (graph: { containedEdges: readonly ElkEdge[] }, id: string): ElkEdge => {
  const found = graph.containedEdges.find((e) => e.id === id);
  if (found === undefined) {
    throw new Error(`Edge not found: ${id}`);
  }
  return found;
};

describe('orthogonal edge router', () => {
  // Two equally-sized nodes in a chain end up vertically aligned
  // (both at indexInLayer = 0). No bend needed.
  it('produces an empty bendPoints array for vertically-aligned source/target', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
      ],
      edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expect(findEdge(graph, 'e').bendPoints).toEqual([]);
  });

  // decision → option1, decision → option2.
  // decision is at layer 0 (column 0); options at layer 1, columns 0 and 1.
  // decision's center x ≠ option2's center x ⇒ edge 'e2' should have 2 bend points.
  it('produces two bend points for misaligned source/target', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'decision', width: 100, height: 40 },
        { id: 'option1', width: 40, height: 30 },
        { id: 'option2', width: 40, height: 30 },
      ],
      edges: [
        { id: 'e1', sources: ['decision'], targets: ['option1'] },
        { id: 'e2', sources: ['decision'], targets: ['option2'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const e2 = findEdge(graph, 'e2');
    // Sanity: e2's target really is option2.
    expect(e2.targets[0]?.id).toBe('option2');
    expect(e2.bendPoints.length).toBe(2);
    const [b1, b2] = e2.bendPoints;
    // Both bend points share the same y (the route runs horizontally between them).
    expect(b1?.y).toBe(b2?.y);

    const decision = graph.children.find((n) => n.id === 'decision');
    const option2 = graph.children.find((n) => n.id === 'option2');
    // First bend is at the source's center x; second is at the target's center x.
    expect(b1?.x).toBe((decision?.x ?? 0) + (decision?.width ?? 0) / 2);
    expect(b2?.x).toBe((option2?.x ?? 0) + (option2?.width ?? 0) / 2);
  });

  // Port-endpoint anchoring: when an edge connects via a port, the bend points
  // should reflect the port's absolute position, not the owning node's center.
  it('anchors at the port position when the endpoint is a port', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        {
          id: 'n1',
          width: 80,
          height: 40,
          ports: [{ id: 'n1.out', x: 70, y: 20, width: 10, height: 10 }],
        },
        { id: 'n2', width: 80, height: 40 },
      ],
      edges: [{ id: 'e', sources: ['n1.out'], targets: ['n2'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const n1 = graph.children.find((n) => n.id === 'n1');
    const e = findEdge(graph, 'e');
    expect(e.bendPoints.length).toBe(2);
    // First bend's x = source port's absolute center x = n1.x + port.x + port.width/2
    const expectedSourceX = (n1?.x ?? 0) + 70 + 5;
    expect(e.bendPoints[0]?.x).toBe(expectedSourceX);
  });

  // Back edges (source below target) anchor at the source's TOP and the target's
  // BOTTOM so the routed line stays in the gap between the two nodes — using the
  // forward anchors (source bottom, target top) would cut through both node bodies.
  it('flips anchor sides for a back edge so the route does not strike either node', async () => {
    // Different widths ⇒ centers don't line up ⇒ bends are required (otherwise
    // a back edge between aligned columns is a straight vertical line, which
    // is also correct but doesn't exercise the bend-flipping logic).
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 100, height: 30 },
        { id: 'b', width: 40, height: 30 },
      ],
      edges: [
        { id: 'forward', sources: ['a'], targets: ['b'] },
        { id: 'back', sources: ['b'], targets: ['a'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const a = graph.children.find((n) => n.id === 'a');
    const b = graph.children.find((n) => n.id === 'b');
    const back = findEdge(graph, 'back');
    expect(back.bendPoints.length).toBe(2);
    // Both bends sit at the midpoint between b's TOP and a's BOTTOM —
    // strictly outside both node bodies, in the gap.
    const bTop = b?.y ?? 0;
    const aBottom = (a?.y ?? 0) + (a?.height ?? 0);
    expect(back.bendPoints[0]?.y).toBeLessThan(bTop);
    expect(back.bendPoints[0]?.y).toBeGreaterThan(aBottom);
    expect(back.bendPoints[1]?.y).toBe(back.bendPoints[0]?.y);
  });

  // Parallel edges (forward + back between the same pair) used to share the
  // same vertical line at the same x — visually one line with arrows at both
  // ends. The router now assigns a lateral offset to the back-edge so it
  // takes a distinct C-shaped detour.
  it('detours a parallel back-edge so it does not overlap the forward edge', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 40, height: 30 },
        { id: 'b', width: 40, height: 30 },
      ],
      edges: [
        { id: 'forward', sources: ['a'], targets: ['b'] },
        { id: 'back', sources: ['b'], targets: ['a'] },
      ],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);

    const forward = findEdge(graph, 'forward');
    const back = findEdge(graph, 'back');
    // Same-column forward edge: no bends, just a straight vertical line.
    expect(forward.bendPoints.length).toBe(0);
    // Back edge gets a 4-bend detour around one side.
    expect(back.bendPoints.length).toBe(4);
    // The two middle bends share an x that's offset from the source/target column.
    expect(back.bendPoints[1]?.x).toBe(back.bendPoints[2]?.x);
    expect(back.bendPoints[1]?.x).not.toBe(back.bendPoints[0]?.x);
  });

  // Hyperedge (2 sources, 1 target). The router skips it; bendPoints stays empty.
  it('skips hyperedges (does not route them)', async () => {
    const graph = fromJson({
      id: 'root',
      children: [
        { id: 'a', width: 30, height: 30 },
        { id: 'b', width: 30, height: 30 },
        { id: 'merge', width: 30, height: 30 },
      ],
      edges: [{ id: 'h', sources: ['a', 'b'], targets: ['merge'] }],
    } satisfies IJsonGraph);

    await buildEngine().layout(graph);
    expect(findEdge(graph, 'h').bendPoints).toEqual([]);
  });
});
