/**
 * Concrete root graph.
 *
 * Identical to a compound `ElkNode` except for the `root: true` discriminator,
 * which lets the engine type-narrow the top-level container.
 */

import { type IGraph } from './i-graph.js';
import { ElkNode, type IElkNodeInput } from './elk-node.js';

export type IElkGraphInput = IElkNodeInput;

export class ElkGraph extends ElkNode implements IGraph {
  public readonly root = true;
}
