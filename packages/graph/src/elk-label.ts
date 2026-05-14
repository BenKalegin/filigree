/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Concrete label.
 *
 * Position and size are mutated by the layout engine after a layout run; the
 * setters here are the only sanctioned way to write them so that a future
 * "freeze after layout" check can hook a single place.
 */

import { type GraphElementId } from './identity.js';
import { type ILabel } from './i-label.js';
import { PropertyHolder } from './property-holder.js';

export interface IElkLabelInput {
  readonly id: GraphElementId;
  readonly text: string;
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export class ElkLabel extends PropertyHolder implements ILabel {
  public readonly id: GraphElementId;
  public readonly text: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(input: IElkLabelInput) {
    super();
    this.id = input.id;
    this.text = input.text;
    this.x = input.x ?? 0;
    this.y = input.y ?? 0;
    this.width = input.width ?? 0;
    this.height = input.height ?? 0;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
