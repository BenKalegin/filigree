/**
 * Width-aware linear node placer.
 *
 * Within each layer, nodes are placed left-to-right with horizontal gaps of
 * `spacingNodeNode` between them — so wide nodes don't overlap narrower
 * siblings. Layer heights are the max height of any node in the layer; the
 * next layer's `y` is computed cumulatively, so layers with tall nodes don't
 * collide with their neighbors.
 *
 * No alignment or balancing — chains may zig-zag. `BalancedNodePlacer` and
 * `BrandesKopfNodePlacer` upgrade that.
 */

import { LayeredPhase } from '../../enums.js';
import { type INodePlacer } from '../../i-node-placer.js';
import { placeNodesLinearly } from '../../model/layer-utils.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { LayeredOptions } from '../../layered-options.js';

export class LinearNodePlacer implements INodePlacer {
  public readonly phase = LayeredPhase.NodePlacement;

  public execute(context: LayeredContext): void {
    const nodeGap = context.options.resolve(LayeredOptions.spacingNodeNode, context.graph);
    const layerGap = context.options.resolve(LayeredOptions.spacingLayer, context.graph);
    placeNodesLinearly(context.layers, nodeGap, layerGap);
  }
}
