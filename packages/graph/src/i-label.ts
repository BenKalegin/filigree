/**
 * Text label attached to a node, edge, or port.
 *
 * Labels are graph elements: they have their own properties (font, alignment, …)
 * and their layout position is decided by the layout algorithm.
 */

import { type IDimensions, type IPoint } from './coordinates.js';
import { type IGraphElement } from './i-graph-element.js';

export interface ILabel extends IGraphElement, IPoint, IDimensions {
  readonly text: string;

  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
}
