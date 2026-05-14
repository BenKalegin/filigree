/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Layered-algorithm-internal node wrapper.
 *
 * Phases reassign `layer`, `indexInLayer`, and the coordinate pair as they run.
 * Regular nodes wrap an `elkNode` from the user's graph; dummy nodes are
 * placeholders created by `LongEdgeSplitter` to give long edges a presence on
 * each intermediate layer (so crossing minimization treats them like a chain
 * of short edges). Only the `LayeredResultApplier` copies positions from
 * regular `LNode`s back to their `ElkNode`s — dummies have no user-visible
 * counterpart.
 */

import { type ElkNode } from '@benkalegin/filigree-graph';

const UNSET_LAYER = -1;
const UNSET_INDEX = -1;

export enum LNodeKind {
  Regular = 'regular',
  Dummy = 'dummy',
}

export class LNode {
  public layer: number = UNSET_LAYER;
  public indexInLayer: number = UNSET_INDEX;
  public x = 0;
  public y = 0;

  private constructor(
    public readonly kind: LNodeKind,
    private readonly elkNodeOrUndefined: ElkNode | undefined,
  ) {}

  public static regular(elkNode: ElkNode): LNode {
    return new LNode(LNodeKind.Regular, elkNode);
  }

  public static dummy(): LNode {
    return new LNode(LNodeKind.Dummy, undefined);
  }

  public get elkNode(): ElkNode {
    if (this.elkNodeOrUndefined === undefined) {
      throw new Error('Dummy LNodes have no ElkNode — guard with isRegular() first.');
    }
    return this.elkNodeOrUndefined;
  }

  public get width(): number {
    return this.elkNodeOrUndefined?.width ?? 0;
  }

  public get height(): number {
    return this.elkNodeOrUndefined?.height ?? 0;
  }

  public isRegular(): boolean {
    return this.kind === LNodeKind.Regular;
  }

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
