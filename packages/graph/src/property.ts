/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Typed property bag.
 *
 * Replaces the Java ELK `IProperty<T>` / `IPropertyHolder` pair. Properties are
 * defined once (`defineProperty(...)`) and referenced everywhere — there is no
 * place in the codebase where a raw string id is used to look up a property.
 */

import { type PropertyId, toPropertyId } from './property-id.js';

export interface IProperty<T> {
  readonly id: PropertyId;
  readonly defaultValue: T;
}

export interface IPropertyHolder {
  getProperty<T>(property: IProperty<T>): T;
  setProperty<T>(property: IProperty<T>, value: T): void;
  hasProperty<T>(property: IProperty<T>): boolean;
}

export interface IDefinePropertyInput<T> {
  readonly id: string;
  readonly defaultValue: T;
}

/**
 * Single place where a bare string id is allowed to enter the property system.
 * Callers should colocate definitions in a `properties.ts` module per package.
 */
export const defineProperty = <T>(input: IDefinePropertyInput<T>): IProperty<T> => ({
  id: toPropertyId(input.id),
  defaultValue: input.defaultValue,
});
