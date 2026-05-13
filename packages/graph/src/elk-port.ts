/**
 * Concrete port. Labels are owned by the port and must be built before it.
 */

import { PortSide } from './enums.js';
import { type GraphElementId } from './identity.js';
import { type IPort } from './i-port.js';
import { type ElkLabel } from './elk-label.js';
import { PropertyHolder } from './property-holder.js';

export interface IElkPortInput {
  readonly id: GraphElementId;
  readonly side?: PortSide | undefined;
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly labels?: readonly ElkLabel[] | undefined;
}

export class ElkPort extends PropertyHolder implements IPort {
  public readonly id: GraphElementId;
  public side: PortSide;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public readonly labels: readonly ElkLabel[];

  constructor(input: IElkPortInput) {
    super();
    this.id = input.id;
    this.side = input.side ?? PortSide.Undefined;
    this.x = input.x ?? 0;
    this.y = input.y ?? 0;
    this.width = input.width ?? 0;
    this.height = input.height ?? 0;
    this.labels = input.labels ?? [];
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public setSide(side: PortSide): void {
    this.side = side;
  }
}
