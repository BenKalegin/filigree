/**
 * Layered-algorithm-internal node wrapper.
 *
 * Phases reassign `layer`, `indexInLayer`, and the coordinate pair as they run.
 * The wrapped `elkNode` is the read-only link back to the user's graph — the
 * `LayeredResultApplier` is the only code that copies positions from `LNode`
 * back to `ElkNode`.
 */

import { type ElkNode } from '@filigree/graph';

const UNSET_LAYER = -1;
const UNSET_INDEX = -1;

export class LNode {
  public layer: number = UNSET_LAYER;
  public indexInLayer: number = UNSET_INDEX;
  public x = 0;
  public y = 0;

  constructor(public readonly elkNode: ElkNode) {}

  public hasLayerAssigned(): boolean {
    return this.layer !== UNSET_LAYER;
  }

  public setLayer(layer: number): void {
    this.layer = layer;
  }

  public setIndexInLayer(index: number): void {
    this.indexInLayer = index;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
