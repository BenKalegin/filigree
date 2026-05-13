/**
 * Brandes-Köpf-style horizontal coordinate assignment.
 *
 * Two vertical alignments form node "blocks" — chains of nodes that share an
 * x-coordinate because each node aligned with its median upper neighbor:
 *
 *   - UP-LEFT  scans each layer left-to-right, prefers leftmost median.
 *   - UP-RIGHT scans each layer right-to-left, prefers rightmost median.
 *
 * Each alignment is compacted left-to-right (blocks placed as close together
 * as widths + node gap permit). The final x of every node is the average of
 * its two compacted x-values.
 *
 * Falls short of full 4-alignment Brandes-Köpf (which adds the two DOWN
 * directions and takes the median, not the average). At this scale the gain
 * is modest; the missing two alignments are a focused next iteration.
 */

import { LayeredPhase } from '../../enums.js';
import { type INodePlacer } from '../../i-node-placer.js';
import { layerHeight } from '../../model/layer-utils.js';
import { type LayeredContext } from '../../model/layered-context.js';
import { type LNode } from '../../model/l-node.js';
import { LayeredOptions } from '../../layered-options.js';

const MAX_COMPACTION_ITERATIONS = 16;

enum HorizontalDirection {
  LeftToRight = 0,
  RightToLeft = 1,
}

interface IBlockAlignment {
  readonly root: ReadonlyMap<LNode, LNode>;
  readonly align: ReadonlyMap<LNode, LNode>;
}

interface IAlignmentState {
  readonly root: Map<LNode, LNode>;
  readonly align: Map<LNode, LNode>;
}

export class BrandesKopfNodePlacer implements INodePlacer {
  public readonly phase = LayeredPhase.NodePlacement;

  public execute(context: LayeredContext): void {
    const nodeGap = context.options.resolve(LayeredOptions.spacingNodeNode, context.graph);
    const layerGap = context.options.resolve(LayeredOptions.spacingLayer, context.graph);
    this.placeY(context, layerGap);
    const leftXs = this.computeXs(context, HorizontalDirection.LeftToRight, nodeGap);
    const rightXs = this.computeXs(context, HorizontalDirection.RightToLeft, nodeGap);
    this.applyAveragedXs(context, leftXs, rightXs);
  }

  private placeY(context: LayeredContext, layerGap: number): void {
    let currentY = 0;
    for (const layer of context.layers) {
      for (const node of layer) {
        node.setPosition(node.x, currentY);
      }
      currentY += layerHeight(layer) + layerGap;
    }
  }

  private computeXs(
    context: LayeredContext,
    direction: HorizontalDirection,
    nodeGap: number,
  ): ReadonlyMap<LNode, number> {
    const alignment = this.verticalAlignment(context, direction);
    return this.compact(context, alignment, nodeGap);
  }

  private verticalAlignment(
    context: LayeredContext,
    direction: HorizontalDirection,
  ): IBlockAlignment {
    const state: IAlignmentState = { root: new Map(), align: new Map() };
    for (const node of context.nodes) {
      state.root.set(node, node);
      state.align.set(node, node);
    }
    for (let layerIndex = 1; layerIndex < context.layers.length; layerIndex++) {
      this.alignLayer(context, layerIndex, direction, state);
    }
    return state;
  }

  private alignLayer(
    context: LayeredContext,
    layerIndex: number,
    direction: HorizontalDirection,
    state: IAlignmentState,
  ): void {
    const layer = context.layers[layerIndex] ?? [];
    const ordered = direction === HorizontalDirection.LeftToRight ? layer : [...layer].reverse();
    const pass: IAlignmentPass = {
      context,
      direction,
      state,
      cursor: createCursor(direction),
    };
    for (const v of ordered) {
      this.tryAlignNode(v, pass);
    }
  }

  private tryAlignNode(v: LNode, pass: IAlignmentPass): void {
    const preds = [...pass.context.predecessorsOf(v)].sort(
      (a, b) => a.indexInLayer - b.indexInLayer,
    );
    if (preds.length === 0) {
      return;
    }
    for (const u of medianCandidates(preds, pass.direction)) {
      if (!pass.cursor.accepts(u.indexInLayer)) {
        continue;
      }
      if (pass.state.align.get(u) !== u) {
        continue; // u already aligned downward to someone else
      }
      const rootOfU = pass.state.root.get(u) ?? u;
      pass.state.align.set(u, v);
      pass.state.align.set(v, rootOfU);
      pass.state.root.set(v, rootOfU);
      pass.cursor.consume(u.indexInLayer);
      return;
    }
  }

  private compact(
    context: LayeredContext,
    alignment: IBlockAlignment,
    nodeGap: number,
  ): ReadonlyMap<LNode, number> {
    const blockX = new Map<LNode, number>();
    for (const node of context.nodes) {
      const root = alignment.root.get(node) ?? node;
      blockX.set(root, 0);
    }
    for (let iter = 0; iter < MAX_COMPACTION_ITERATIONS; iter++) {
      if (!this.sweepCompaction(context, alignment, blockX, nodeGap)) {
        break;
      }
    }
    return this.expandBlockXs(context, alignment, blockX);
  }

  private sweepCompaction(
    context: LayeredContext,
    alignment: IBlockAlignment,
    blockX: Map<LNode, number>,
    nodeGap: number,
  ): boolean {
    let changed = false;
    for (const layer of context.layers) {
      let prevRight = 0;
      for (const v of layer) {
        const root = alignment.root.get(v) ?? v;
        const required = Math.max(blockX.get(root) ?? 0, prevRight);
        if (required > (blockX.get(root) ?? 0)) {
          blockX.set(root, required);
          changed = true;
        }
        prevRight = required + v.elkNode.width + nodeGap;
      }
    }
    return changed;
  }

  private expandBlockXs(
    context: LayeredContext,
    alignment: IBlockAlignment,
    blockX: ReadonlyMap<LNode, number>,
  ): ReadonlyMap<LNode, number> {
    const result = new Map<LNode, number>();
    for (const node of context.nodes) {
      const root = alignment.root.get(node) ?? node;
      result.set(node, blockX.get(root) ?? 0);
    }
    return result;
  }

  private applyAveragedXs(
    context: LayeredContext,
    leftXs: ReadonlyMap<LNode, number>,
    rightXs: ReadonlyMap<LNode, number>,
  ): void {
    for (const node of context.nodes) {
      const xL = leftXs.get(node) ?? 0;
      const xR = rightXs.get(node) ?? 0;
      node.setPosition((xL + xR) / 2, node.y);
    }
  }
}

interface ICursor {
  readonly accepts: (index: number) => boolean;
  readonly consume: (index: number) => void;
}

interface IAlignmentPass {
  readonly context: LayeredContext;
  readonly direction: HorizontalDirection;
  readonly state: IAlignmentState;
  readonly cursor: ICursor;
}

const createCursor = (direction: HorizontalDirection): ICursor => {
  let lastIndex = direction === HorizontalDirection.LeftToRight ? -1 : Number.POSITIVE_INFINITY;
  const ltr = direction === HorizontalDirection.LeftToRight;
  return {
    accepts: (index) => (ltr ? index > lastIndex : index < lastIndex),
    consume: (index) => {
      lastIndex = index;
    },
  };
};

const medianCandidates = (
  sortedPreds: readonly LNode[],
  direction: HorizontalDirection,
): readonly LNode[] => {
  const n = sortedPreds.length;
  const lo = Math.floor((n - 1) / 2);
  const hi = Math.ceil((n - 1) / 2);
  const slice = sortedPreds.slice(lo, hi + 1);
  return direction === HorizontalDirection.LeftToRight ? slice : [...slice].reverse();
};
