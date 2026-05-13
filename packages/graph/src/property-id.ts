/**
 * Branded id for properties. See `identity.ts` for the same pattern applied to graph elements.
 */

declare const propertyIdBrand: unique symbol;

export type PropertyId = string & { readonly [propertyIdBrand]: never };

export const toPropertyId = (raw: string): PropertyId => raw as PropertyId;
