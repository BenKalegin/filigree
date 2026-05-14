/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Default in-memory implementation of `IPropertyHolder`.
 *
 * Stored as a Map keyed by `PropertyId`. Missing values fall back to the
 * property's declared `defaultValue`, so consumers never receive `undefined`
 * for a property that has one — the surrounding code does not need to know
 * whether a value was explicitly set or defaulted.
 */

import { type IProperty, type IPropertyHolder } from './property.js';
import { type PropertyId } from './property-id.js';

export class PropertyHolder implements IPropertyHolder {
  private readonly values = new Map<PropertyId, unknown>();

  public getProperty<T>(property: IProperty<T>): T {
    if (this.values.has(property.id)) {
      return this.values.get(property.id) as T;
    }
    return property.defaultValue;
  }

  public setProperty<T>(property: IProperty<T>, value: T): void {
    this.values.set(property.id, value);
  }

  public hasProperty<T>(property: IProperty<T>): boolean {
    return this.values.has(property.id);
  }

  /**
   * Read-only view of the set property values. Used by serializers and debug
   * dumps; layout code reads through `getProperty` instead.
   */
  public propertyEntries(): readonly (readonly [PropertyId, unknown])[] {
    return [...this.values.entries()];
  }
}
