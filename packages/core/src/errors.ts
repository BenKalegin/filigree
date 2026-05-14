/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Typed errors raised by the engine and algorithm registry.
 */

export enum CoreErrorName {
  AlgorithmNotFound = 'AlgorithmNotFoundError',
  OptionConflict = 'OptionConflictError',
  LayoutAborted = 'LayoutAbortedError',
}

export class CoreError extends Error {
  public override readonly name: CoreErrorName;

  constructor(name: CoreErrorName, message: string) {
    super(message);
    this.name = name;
  }
}

export class AlgorithmNotFoundError extends CoreError {
  constructor(message: string) {
    super(CoreErrorName.AlgorithmNotFound, message);
  }
}

export class OptionConflictError extends CoreError {
  constructor(message: string) {
    super(CoreErrorName.OptionConflict, message);
  }
}

export class LayoutAbortedError extends CoreError {
  constructor(message: string) {
    super(CoreErrorName.LayoutAborted, message);
  }
}
