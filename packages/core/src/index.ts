/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Public surface of @filigree/core.
 */

export { OptionScope, LayoutPhaseEvent } from './enums.js';
export { type PhaseId, toPhaseId } from './phase-id.js';
export {
  CoreErrorName,
  CoreError,
  AlgorithmNotFoundError,
  OptionConflictError,
  LayoutAbortedError,
} from './errors.js';
export type { IOption, IOptionResolver } from './i-option.js';
export type { ILayoutContext } from './i-layout-context.js';
export type { ILayoutAlgorithm } from './i-layout-algorithm.js';
export type { IAlgorithmRegistry } from './i-algorithm-registry.js';
export type {
  ILayoutObserver,
  IAlgorithmStartObserver,
  IAlgorithmEndObserver,
  IPhaseObserver,
} from './i-layout-observer.js';
export type { ILayoutEngine } from './i-layout-engine.js';
export { AlgorithmOption, CompoundPaddingOption } from './well-known-options.js';
export { DefaultAlgorithmRegistry } from './default-algorithm-registry.js';
export { DefaultOptionResolver } from './default-option-resolver.js';
export { DefaultLayoutEngine } from './default-layout-engine.js';
