/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * JSON shape used for serialization and deserialization.
 *
 * Mirrors the `elkjs` JSON format so users can migrate without rewriting input.
 * Field names match exactly — including the slightly inconsistent ELK convention
 * of nesting child nodes under `children` but contained edges under `edges`.
 */

export interface IJsonDimensions {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface IJsonLayoutOptions {
  readonly layoutOptions?: Readonly<Record<string, unknown>>;
}

export interface IJsonLabel extends IJsonDimensions, IJsonLayoutOptions {
  readonly id?: string;
  readonly text: string;
}

export interface IJsonPort extends IJsonDimensions, IJsonLayoutOptions {
  readonly id: string;
  readonly labels?: readonly IJsonLabel[];
}

export interface IJsonBendPoint {
  readonly x: number;
  readonly y: number;
}

export interface IJsonEdge extends IJsonLayoutOptions {
  readonly id: string;
  readonly sources: readonly string[];
  readonly targets: readonly string[];
  readonly labels?: readonly IJsonLabel[];
  readonly bendPoints?: readonly IJsonBendPoint[];
}

export interface IJsonNode extends IJsonDimensions, IJsonLayoutOptions {
  readonly id: string;
  readonly labels?: readonly IJsonLabel[];
  readonly ports?: readonly IJsonPort[];
  readonly children?: readonly IJsonNode[];
  readonly edges?: readonly IJsonEdge[];
}

/**
 * Loose shape of a hint in the JSON graph. `kind` discriminates which hint
 * (e.g. `'OrderBefore'`, `'SameLayer'`, `'Group'`, `'PinPosition'`,
 * `'Focus'`); the remaining fields depend on the kind. See
 * `@filigree/hints` for the full per-kind schema.
 *
 * The graph package itself doesn't parse hints — it just carries the JSON
 * shape so downstream tooling (`@filigree/api`'s `layout`) can hand the
 * array to `@filigree/hints` for `attachHints`. Keeping the type loose
 * avoids a graph → hints dependency.
 */
export interface IJsonHint {
  readonly kind: string;
  readonly [field: string]: unknown;
}

export interface IJsonGraph extends IJsonNode {
  /**
   * Hints attached to the graph in JSON form. Equivalent to calling
   * `attachHints(graph, …)` post-`fromJson`. Parsed by `@filigree/api`'s
   * `layout` entry point — the bare `fromJson` ignores this field.
   */
  readonly filigreeHints?: readonly IJsonHint[];
}
