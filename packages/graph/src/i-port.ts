/**
 * Connection point on a node where edges attach.
 *
 * The port's `side` is what the layout algorithm uses to decide which edges
 * approach from which direction.
 */

import { type IDimensions, type IPoint } from './coordinates.js';
import { type PortSide } from './enums.js';
import { type IGraphElement } from './i-graph-element.js';
import { type ILabel } from './i-label.js';

export interface IPort extends IGraphElement, IPoint, IDimensions {
  readonly side: PortSide;
  readonly labels: readonly ILabel[];

  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
}
