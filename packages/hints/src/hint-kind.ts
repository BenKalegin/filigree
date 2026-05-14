/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Closed enum of hint kinds.
 *
 * Each value identifies one shape of human author intent that the layout
 * pipeline can honor. Hints are filigree's deliberate divergence from
 * upstream ELK — a way for an end user authoring a diagram to nudge
 * specific layout decisions without writing algorithm code.
 *
 * Adding a new hint type: add a kind here, define its `IHint` subtype,
 * wire an applicator in `apply-hints.ts`. All existing applicators stay
 * intact (Open/Closed).
 */

export enum HintKind {
  PinPosition = 'pin-position',
  SameLayer = 'same-layer',
  OrderBefore = 'order-before',
  Group = 'group',
  Focus = 'focus',
}
