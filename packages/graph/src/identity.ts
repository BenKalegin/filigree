/**
 * Branded id type for graph elements.
 *
 * The brand stops bare strings being passed where an id is expected — TypeScript
 * forbids the implicit string-to-id assignment. Construction goes through `toGraphElementId`,
 * which is the only place a bare string crosses the brand boundary.
 */

declare const graphElementIdBrand: unique symbol;

export type GraphElementId = string & { readonly [graphElementIdBrand]: never };

export const toGraphElementId = (raw: string): GraphElementId => raw as GraphElementId;
