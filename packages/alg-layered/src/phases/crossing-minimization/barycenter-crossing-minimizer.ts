/**
 * Barycenter heuristic for edge-crossing minimization.
 *
 * For each layer, compute every node's "barycenter" — the average index of its
 * neighbors in the adjacent layer — then sort the layer by that value. Down-
 * sweep looks at predecessors; up-sweep looks at successors. Two passes per
 * iteration; iterate until no layer changes or `MAX_SWEEPS` is reached.
 *
 * Nodes with no neighbors in the reference layer keep their original index
 * (otherwise they'd all collapse to barycenter 0).
 *
 * Heuristic, not optimal. Good enough for ~50-node graphs; replace with
 * branch-and-bound or a network-simplex-based minimizer for production.
 */

import { LayeredPhase } from '../../enums.js';
import { type ICrossingMinimizer } from '../../i-crossing-minimizer.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';

const MAX_SWEEPS = 24;

enum SweepDirection {
  Down = 0,
  Up = 1,
}

interface IRankedNode {
  readonly node: LNode;
  readonly barycenter: number;
  readonly originalIndex: number;
}

export class BarycenterCrossingMinimizer implements ICrossingMinimizer {
  public readonly phase = LayeredPhase.CrossingMinimization;

  public execute(context: LayeredContext): void {
    for (let sweep = 0; sweep < MAX_SWEEPS; sweep++) {
      const downChanged = this.sweep(context, SweepDirection.Down);
      const upChanged = this.sweep(context, SweepDirection.Up);
      if (!downChanged && !upChanged) {
        return;
      }
    }
  }

  private sweep(context: LayeredContext, direction: SweepDirection): boolean {
    const layerIndices = this.layerIndicesFor(context, direction);
    let changed = false;
    for (const layerIndex of layerIndices) {
      if (this.reorderLayer(context, layerIndex, direction)) {
        changed = true;
      }
    }
    return changed;
  }

  private layerIndicesFor(context: LayeredContext, direction: SweepDirection): readonly number[] {
    const last = context.layers.length - 1;
    if (direction === SweepDirection.Down) {
      // Down-sweep refines layers 1..last using their predecessors (layer 0 is fixed input order).
      return Array.from({ length: last }, (_, i) => i + 1);
    }
    // Up-sweep refines layers 0..last-1 using their successors.
    return Array.from({ length: last }, (_, i) => last - 1 - i);
  }

  private reorderLayer(
    context: LayeredContext,
    layerIndex: number,
    direction: SweepDirection,
  ): boolean {
    const layer = context.layers[layerIndex] ?? [];
    const ranked = layer.map((node, index) => this.rank(node, context, direction, index));
    ranked.sort(this.byBarycenterThenOriginalIndex);
    const newOrder = ranked.map((entry) => entry.node);
    if (this.sameOrder(layer, newOrder)) {
      return false;
    }
    context.reorderLayer(layerIndex, newOrder);
    return true;
  }

  private rank(
    node: LNode,
    context: LayeredContext,
    direction: SweepDirection,
    originalIndex: number,
  ): IRankedNode {
    const neighbors =
      direction === SweepDirection.Down ? context.predecessorsOf(node) : context.successorsOf(node);
    const barycenter =
      neighbors.length === 0
        ? originalIndex
        : neighbors.reduce((sum, n) => sum + n.indexInLayer, 0) / neighbors.length;
    return { node, barycenter, originalIndex };
  }

  private readonly byBarycenterThenOriginalIndex = (a: IRankedNode, b: IRankedNode): number => {
    if (a.barycenter !== b.barycenter) {
      return a.barycenter - b.barycenter;
    }
    return a.originalIndex - b.originalIndex;
  };

  private sameOrder(before: readonly LNode[], after: readonly LNode[]): boolean {
    return before.every((node, index) => node === after[index]);
  }
}
