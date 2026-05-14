/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Layout option: a typed configuration value an algorithm reads at runtime.
 *
 * Distinct from `IProperty<T>` from @filigree/graph because an option carries
 * metadata that the engine needs (scope, description) and a property does not.
 * An option *is* a property under the hood — every option has a backing property
 * used to store values on graph elements.
 */

import { type IGraphElement, type IProperty } from '@filigree/graph';

import { type OptionScope } from './enums.js';

export interface IOption<T> {
  readonly property: IProperty<T>;
  readonly name: string;
  readonly description: string;
  readonly scopes: ReadonlySet<OptionScope>;
}

export interface IOptionResolver {
  /**
   * Resolve an option's effective value for a graph element by walking the
   * scope chain (element → parent → graph → algorithm default).
   */
  resolve<T>(option: IOption<T>, on: IGraphElement): T;
}
