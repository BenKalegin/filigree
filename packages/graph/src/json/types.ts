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

export type IJsonGraph = IJsonNode;
