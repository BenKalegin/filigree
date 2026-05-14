/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Closed sets shared across the core engine.
 */

export enum OptionScope {
  Algorithm = 'algorithm',
  Graph = 'graph',
  Node = 'node',
  Edge = 'edge',
  Port = 'port',
  Label = 'label',
}

export enum LayoutPhaseEvent {
  Started = 'started',
  Completed = 'completed',
  Failed = 'failed',
}
