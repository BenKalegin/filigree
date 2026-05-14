/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Single entry point for performing a layout.
 *
 * The engine is responsible for:
 *   - resolving which algorithm to run (from the graph's algorithm option),
 *   - building the layout context,
 *   - dispatching to the algorithm via `ILayoutAlgorithm.run`,
 *   - recursing into compound children,
 *   - notifying observers.
 *
 * It is *not* responsible for any algorithm-specific logic. Everything algorithm-shaped
 * lives behind `ILayoutAlgorithm`.
 */

import { type IGraph } from '@filigree/graph';

export interface ILayoutEngine {
  layout(graph: IGraph): Promise<IGraph>;
}
