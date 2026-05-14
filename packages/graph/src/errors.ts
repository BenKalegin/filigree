/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Typed error classes thrown across the graph package.
 *
 * Bare `throw new Error(...)` is banned in business logic — pick or add a
 * subtype here. Error instances carry a stable `name` so callers can branch on
 * `error.name === GraphErrorName.InvalidGraph` without instanceof gymnastics.
 */

export enum GraphErrorName {
  InvalidGraph = 'InvalidGraphError',
  UnknownProperty = 'UnknownPropertyError',
}

export class GraphError extends Error {
  public override readonly name: GraphErrorName;

  constructor(name: GraphErrorName, message: string) {
    super(message);
    this.name = name;
  }
}

export class InvalidGraphError extends GraphError {
  constructor(message: string) {
    super(GraphErrorName.InvalidGraph, message);
  }
}

export class UnknownPropertyError extends GraphError {
  constructor(message: string) {
    super(GraphErrorName.UnknownProperty, message);
  }
}
