/**
 * Node in the graph.
 *
 * A compound node has children and (optionally) contains its own edges; that
 * lets ELK lay out arbitrary nested hierarchies.
 */

import { type IDimensions, type IPoint } from './coordinates.js';
import { type NodeKind } from './enums.js';
import { type IEdge } from './i-edge.js';
import { type IGraphElement } from './i-graph-element.js';
import { type ILabel } from './i-label.js';
import { type IPort } from './i-port.js';

export interface INode extends IGraphElement, IPoint, IDimensions {
  readonly kind: NodeKind;
  readonly labels: readonly ILabel[];
  readonly ports: readonly IPort[];
  readonly children: readonly INode[];
  readonly containedEdges: readonly IEdge[];
  /**
   * The compound node that contains this one, or `null` for the graph root.
   * Used by the option resolver to inherit layout settings (e.g. `elk.padding`
   * set on the root applies to every descendant unless overridden).
   */
  readonly parent: INode | null;

  /** Update the node's top-left corner. Called by the layout engine after a run. */
  setPosition(x: number, y: number): void;
  /** Update the node's dimensions. Called by the engine for compound nodes. */
  setSize(width: number, height: number): void;
  /** Set the containing compound node. Called once during graph construction. */
  setParent(parent: INode | null): void;
}
