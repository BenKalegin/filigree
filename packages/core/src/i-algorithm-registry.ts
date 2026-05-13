/**
 * Pluggable registry of layout algorithms.
 *
 * The default implementation (in @elk/core) is a simple map. Hosts that want
 * dynamic discovery (lazy imports, plugin loading) implement their own and
 * inject it into the engine. There are no extension points — composition is
 * explicit at construction time.
 */

import { type ILayoutAlgorithm } from './i-layout-algorithm.js';

export interface IAlgorithmRegistry {
  register(algorithm: ILayoutAlgorithm): void;
  get(id: string): ILayoutAlgorithm | undefined;
  list(): readonly ILayoutAlgorithm[];
}
