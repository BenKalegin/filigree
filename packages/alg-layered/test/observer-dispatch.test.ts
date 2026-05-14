/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * End-to-end: register an observer with the engine, run a layered layout,
 * verify both algorithm-level and per-phase events fire in order.
 */

import { describe, expect, it } from 'vitest';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type IAlgorithmEndObserver,
  type IAlgorithmStartObserver,
  type IPhaseObserver,
  type ILayoutAlgorithm,
  LayoutPhaseEvent,
  type PhaseId,
} from '@benkalegin/filigree-core';
import { fromJson, type IJsonGraph } from '@benkalegin/filigree-graph';

import { createDefaultLayeredAlgorithm } from '../src/composition.js';
import { LayeredPhase } from '../src/enums.js';

enum RecordedKind {
  AlgorithmStarted = 'algorithm-started',
  AlgorithmCompleted = 'algorithm-completed',
  Phase = 'phase',
}

interface IRecordedEvent {
  readonly kind: RecordedKind;
  readonly phaseEvent?: LayoutPhaseEvent;
  readonly phaseId?: PhaseId;
  readonly algorithmId?: string;
}

class RecordingObserver
  implements IAlgorithmStartObserver, IAlgorithmEndObserver, IPhaseObserver
{
  public readonly events: IRecordedEvent[] = [];

  public onAlgorithmStarted(algorithm: ILayoutAlgorithm): void {
    this.events.push({ kind: RecordedKind.AlgorithmStarted, algorithmId: algorithm.id });
  }

  public onAlgorithmCompleted(algorithm: ILayoutAlgorithm): void {
    this.events.push({ kind: RecordedKind.AlgorithmCompleted, algorithmId: algorithm.id });
  }

  public onPhase(event: LayoutPhaseEvent, phaseId: PhaseId): void {
    this.events.push({ kind: RecordedKind.Phase, phaseEvent: event, phaseId });
  }
}

const SIMPLE_GRAPH: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'a', width: 30, height: 30 },
    { id: 'b', width: 30, height: 30 },
  ],
  edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
};

describe('observer dispatch through DefaultLayoutEngine + LayeredAlgorithm', () => {
  it('fires algorithm-started, every phase (start+complete), then algorithm-completed', async () => {
    const observer = new RecordingObserver();
    const registry = new DefaultAlgorithmRegistry();
    registry.register(createDefaultLayeredAlgorithm());
    const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver(), [observer]);
    await engine.layout(fromJson(SIMPLE_GRAPH));

    // First and last events bracket the algorithm.
    expect(observer.events.at(0)?.kind).toBe(RecordedKind.AlgorithmStarted);
    expect(observer.events.at(-1)?.kind).toBe(RecordedKind.AlgorithmCompleted);
    expect(observer.events.at(0)?.algorithmId).toBe('layered');

    // Every layered phase fires Started immediately followed by Completed.
    const phases: readonly LayeredPhase[] = [
      LayeredPhase.CycleBreaking,
      LayeredPhase.LayerAssignment,
      LayeredPhase.LongEdgeProcessing,
      LayeredPhase.CrossingMinimization,
      LayeredPhase.NodePlacement,
      LayeredPhase.EdgeRouting,
    ];
    const phaseEvents = observer.events.filter((e) => e.kind === RecordedKind.Phase);
    expect(phaseEvents.length).toBe(phases.length * 2);
    for (const [i, phase] of phases.entries()) {
      expect(phaseEvents[i * 2]?.phaseEvent).toBe(LayoutPhaseEvent.Started);
      expect(phaseEvents[i * 2]?.phaseId).toBe(phase);
      expect(phaseEvents[i * 2 + 1]?.phaseEvent).toBe(LayoutPhaseEvent.Completed);
      expect(phaseEvents[i * 2 + 1]?.phaseId).toBe(phase);
    }
  });

  it('runs without an observer list (default empty)', async () => {
    const registry = new DefaultAlgorithmRegistry();
    registry.register(createDefaultLayeredAlgorithm());
    const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
    await expect(engine.layout(fromJson(SIMPLE_GRAPH))).resolves.toBeDefined();
  });
});
