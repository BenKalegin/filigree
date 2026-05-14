/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

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
