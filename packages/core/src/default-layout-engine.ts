/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Default engine that dispatches to a registered algorithm.
 *
 * Scope is intentionally narrow: pick an algorithm by id, build a context,
 * run it, and bracket the run with algorithm-start/complete observer
 * events. Phase-level events fire from inside the algorithm via
 * `context.dispatcher`. No per-element option pre-resolution — those
 * belong inside the algorithm itself (which can be as sophisticated as it
 * wants).
 */

import { type IGraph, type INode, type IRect } from '@filigree/graph';

import { EventDispatcher } from './event-dispatcher.js';
import { AlgorithmNotFoundError } from './errors.js';
import { type IAlgorithmRegistry } from './i-algorithm-registry.js';
import { type ILayoutAlgorithm } from './i-layout-algorithm.js';
import { type ILayoutContext } from './i-layout-context.js';
import { type ILayoutEngine } from './i-layout-engine.js';
import { type ILayoutObserver } from './i-layout-observer.js';
import { type IOptionResolver } from './i-option.js';
import { AlgorithmOption, CompoundPaddingOption } from './well-known-options.js';

/**
 * Layout engine that walks the graph bottom-up.
 *
 * For each compound node it first lays out the contents (so the compound's
 * intrinsic size is known), then includes it in its parent's layout. Leaf
 * nodes are skipped — they have no contents to lay out.
 *
 * Each level picks an algorithm via the `elk.algorithm` option resolved on
 * that level's container node, so different sub-graphs can use different
 * algorithms without engine changes.
 */
export class DefaultLayoutEngine implements ILayoutEngine {
  private readonly dispatcher: EventDispatcher;

  constructor(
    private readonly registry: IAlgorithmRegistry,
    private readonly optionResolver: IOptionResolver,
    observers: readonly ILayoutObserver[] = [],
  ) {
    this.dispatcher = new EventDispatcher(observers);
  }

  public async layout(graph: IGraph): Promise<IGraph> {
    await this.layoutSubgraph(graph);
    return graph;
  }

  private async layoutSubgraph(container: INode): Promise<void> {
    for (const child of container.children) {
      if (child.children.length > 0) {
        await this.layoutSubgraph(child);
      }
    }
    if (container.children.length === 0) return;
    const algorithm = this.resolveAlgorithm(container);
    const context: ILayoutContext = {
      graph: container,
      options: this.optionResolver,
      dispatcher: this.dispatcher,
    };
    this.dispatcher.algorithmStarted(algorithm, context);
    await algorithm.run(context);
    this.dispatcher.algorithmCompleted(algorithm, context);
    const padding = this.optionResolver.resolve(CompoundPaddingOption, container);
    this.fitContainerToChildren(container, padding);
  }

  private resolveAlgorithm(container: INode): ILayoutAlgorithm {
    const algorithmId = this.optionResolver.resolve(AlgorithmOption, container);
    const algorithm = this.registry.get(algorithmId);
    if (algorithm === undefined) {
      throw new AlgorithmNotFoundError(`No algorithm registered with id "${algorithmId}".`);
    }
    return algorithm;
  }

  /**
   * Resize a container to fit its children with symmetric padding.
   *
   * Algorithms place children in whatever coordinate system they prefer —
   * top-left-anchored layered output starts at (0, 0); force-directed
   * scatters around the origin and may produce negative coords. We compute
   * the children's true bounding box, shift everything so the box's
   * top-left lands at `(padding, padding)`, and size the container to the
   * box plus padding on every side. Contained edges are shifted too so
   * their already-routed bend points still line up.
   */
  private fitContainerToChildren(container: INode, padding: number): void {
    const box = bboxOf(container.children);
    const shiftX = padding - box.x;
    const shiftY = padding - box.y;
    for (const child of container.children) {
      child.setPosition(child.x + shiftX, child.y + shiftY);
    }
    for (const edge of container.containedEdges) {
      edge.setBendPoints(edge.bendPoints.map((p) => ({ x: p.x + shiftX, y: p.y + shiftY })));
      if (edge.routeSegments.length > 0) {
        edge.setRouteSegments(
          edge.routeSegments.map((segment) =>
            segment.map((p) => ({ x: p.x + shiftX, y: p.y + shiftY })),
          ),
        );
      }
    }
    container.setSize(box.width + padding * 2, box.height + padding * 2);
  }
}

const bboxOf = (children: readonly INode[]): IRect => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const child of children) {
    minX = Math.min(minX, child.x);
    minY = Math.min(minY, child.y);
    maxX = Math.max(maxX, child.x + child.width);
    maxY = Math.max(maxY, child.y + child.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};
