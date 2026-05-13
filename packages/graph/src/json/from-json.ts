/**
 * Entry point for deserializing an elkjs-compatible JSON object into an `ElkGraph`.
 *
 * The structural shape of `input` is validated at the top level only; deeper
 * shape mismatches surface as `InvalidGraphError` from the parser itself
 * (missing id, unknown endpoint, duplicate element). A future hardened
 * validator can be slotted in here without touching the parser.
 */

import { CountingIdAllocator } from '../counting-id-allocator.js';
import { type ElkGraph } from '../elk-graph.js';
import { InvalidGraphError } from '../errors.js';
import { GraphFactory } from '../graph-factory.js';
import { JsonParser } from './json-parser.js';
import { type IJsonGraph } from './types.js';

export interface IFromJsonOptions {
  readonly factory?: GraphFactory;
}

export const fromJson = (input: unknown, options: IFromJsonOptions = {}): ElkGraph => {
  const json = assertJsonGraph(input);
  const factory = options.factory ?? new GraphFactory({ idAllocator: new CountingIdAllocator() });
  const parser = new JsonParser(factory);
  return parser.parseGraph(json);
};

const assertJsonGraph = (input: unknown): IJsonGraph => {
  if (input === null || typeof input !== 'object') {
    throw new InvalidGraphError('JSON input must be an object.');
  }
  if (!('id' in input) || typeof input.id !== 'string') {
    throw new InvalidGraphError('JSON graph root must have a string "id" field.');
  }
  return input as IJsonGraph;
};
