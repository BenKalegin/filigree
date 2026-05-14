/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Branded id used to identify a layout phase across the algorithm/observer boundary.
 *
 * The engine and observers live in @benkalegin/filigree-core and do not know about algorithm-specific
 * phase enums (e.g. `LayeredPhase` in @benkalegin/filigree-alg-layered). At the boundary, algorithms
 * cast their enum value through `toPhaseId` — observers receive an opaque, type-safe id
 * and may match on it without taking a dependency on any algorithm package.
 */

declare const phaseIdBrand: unique symbol;

export type PhaseId = string & { readonly [phaseIdBrand]: never };

export const toPhaseId = (raw: string): PhaseId => raw as PhaseId;
