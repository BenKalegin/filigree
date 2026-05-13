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
