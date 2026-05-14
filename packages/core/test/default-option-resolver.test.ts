/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';
import { defineProperty, fromJson, type INode, type IJsonGraph } from '@benkalegin/filigree-graph';

import { DefaultOptionResolver } from '../src/default-option-resolver.js';
import { OptionScope } from '../src/enums.js';
import { type IOption } from '../src/i-option.js';

const customSpacing: IOption<number> = {
  property: defineProperty<number>({ id: 'test.spacing', defaultValue: 999 }),
  name: 'Test spacing',
  description: 'Synthetic option used to verify hierarchical inheritance.',
  scopes: new Set([OptionScope.Graph]),
};

const findById = (root: { children: readonly INode[] }, id: string): INode => {
  const found = root.children.find((n) => n.id === id);
  if (found === undefined) {
    throw new Error(`Node not found: ${id}`);
  }
  return found;
};

describe('DefaultOptionResolver', () => {
  const graphJson: IJsonGraph = {
    id: 'root',
    children: [
      {
        id: 'parent',
        children: [
          { id: 'leaf-a', width: 10, height: 10 },
          { id: 'leaf-b', width: 10, height: 10 },
        ],
      },
    ],
  };

  it('returns the property default when nothing is set anywhere', () => {
    const graph = fromJson(graphJson);
    const resolver = new DefaultOptionResolver();
    const leaf = findById(findById(graph, 'parent'), 'leaf-a');
    expect(resolver.resolve(customSpacing, leaf)).toBe(999);
  });

  it("returns the element's own value when set directly", () => {
    const graph = fromJson(graphJson);
    const leaf = findById(findById(graph, 'parent'), 'leaf-a');
    leaf.setProperty(customSpacing.property, 5);
    const resolver = new DefaultOptionResolver();
    expect(resolver.resolve(customSpacing, leaf)).toBe(5);
  });

  it('inherits from the parent compound when the element is unset', () => {
    const graph = fromJson(graphJson);
    const parent = findById(graph, 'parent');
    parent.setProperty(customSpacing.property, 22);
    const leaf = findById(parent, 'leaf-a');
    const resolver = new DefaultOptionResolver();
    expect(resolver.resolve(customSpacing, leaf)).toBe(22);
  });

  it('inherits from the root graph all the way down', () => {
    const graph = fromJson(graphJson);
    graph.setProperty(customSpacing.property, 7);
    const leaf = findById(findById(graph, 'parent'), 'leaf-a');
    const resolver = new DefaultOptionResolver();
    expect(resolver.resolve(customSpacing, leaf)).toBe(7);
  });

  it('prefers the nearest ancestor over a farther one', () => {
    const graph = fromJson(graphJson);
    graph.setProperty(customSpacing.property, 100);
    const parent = findById(graph, 'parent');
    parent.setProperty(customSpacing.property, 50);
    const leaf = findById(parent, 'leaf-a');
    const resolver = new DefaultOptionResolver();
    expect(resolver.resolve(customSpacing, leaf)).toBe(50);
  });
});
