/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Branded id for properties. See `identity.ts` for the same pattern applied to graph elements.
 */

declare const propertyIdBrand: unique symbol;

export type PropertyId = string & { readonly [propertyIdBrand]: never };

export const toPropertyId = (raw: string): PropertyId => raw as PropertyId;
