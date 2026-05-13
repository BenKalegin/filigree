/**
 * Type guards that hide the structural `'children' in x` discrimination
 * between `INode` and `IPort`.
 *
 * Centralizing them here ensures the literal property name appears in exactly
 * one place. Algorithm and renderer code uses `isNode` / `isPort` instead of
 * the raw narrowing, which keeps the convention "no string constants in
 * business logic" honest.
 */

import { type IGraphElement } from './i-graph-element.js';
import { type INode } from './i-node.js';
import { type IPort } from './i-port.js';

export const isNode = (element: IGraphElement): element is INode => 'children' in element;

export const isPort = (element: IGraphElement): element is IPort =>
  'side' in element && !('children' in element);
