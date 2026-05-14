/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Additional fixtures for algorithms added after `example-fixtures.ts` hit
 * the per-file size limit. Kept here so we don't have to split the original
 * file in two.
 */

import { type IJsonGraph } from '@benkalegin/filigree-graph';

// Twelve cards of varied size — typical input for rectpacking, which
// ignores edges entirely. Mix of widths and heights so the shelf packer
// has something interesting to do.
export const CARDS: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'rectpacking' },
  children: [
    { id: 'a', width: 120, height: 80, labels: [{ text: 'Card A' }] },
    { id: 'b', width: 90, height: 60, labels: [{ text: 'Card B' }] },
    { id: 'c', width: 70, height: 70, labels: [{ text: 'Card C' }] },
    { id: 'd', width: 100, height: 50, labels: [{ text: 'Card D' }] },
    { id: 'e', width: 80, height: 80, labels: [{ text: 'Card E' }] },
    { id: 'f', width: 60, height: 40, labels: [{ text: 'Card F' }] },
    { id: 'g', width: 50, height: 50, labels: [{ text: 'Card G' }] },
    { id: 'h', width: 110, height: 40, labels: [{ text: 'Card H' }] },
    { id: 'i', width: 70, height: 50, labels: [{ text: 'Card I' }] },
    { id: 'j', width: 90, height: 70, labels: [{ text: 'Card J' }] },
    { id: 'k', width: 50, height: 30, labels: [{ text: 'Card K' }] },
    { id: 'l', width: 80, height: 50, labels: [{ text: 'Card L' }] },
  ],
};

// A merge step: three event producers all feed one consumer via a single
// hyperedge (3 sources, 1 target). Exercises the junction-style
// hyperedge routing — the orthogonal router emits one route segment
// per branch instead of a single polyline.
export const HYPEREDGE_MERGE: IJsonGraph = {
  id: 'root',
  children: [
    { id: 'producer_a', width: 80, height: 30, labels: [{ text: 'Producer A' }] },
    { id: 'producer_b', width: 80, height: 30, labels: [{ text: 'Producer B' }] },
    { id: 'producer_c', width: 80, height: 30, labels: [{ text: 'Producer C' }] },
    { id: 'consumer_x', width: 80, height: 30, labels: [{ text: 'Consumer X' }] },
    { id: 'consumer_y', width: 80, height: 30, labels: [{ text: 'Consumer Y' }] },
    { id: 'merge', width: 80, height: 40, labels: [{ text: 'Merge' }] },
  ],
  edges: [
    { id: 'fan_in', sources: ['producer_a', 'producer_b', 'producer_c'], targets: ['merge'] },
    { id: 'fan_out', sources: ['merge'], targets: ['consumer_x', 'consumer_y'] },
  ],
};

// A small mesh: every node connects to its neighbors. Stress majorization
// should resolve this into a roughly round, evenly-spaced arrangement
// where every neighbor pair sits at the desired edge length.
export const MESH: IJsonGraph = {
  id: 'root',
  layoutOptions: { 'elk.algorithm': 'stress' },
  children: [
    { id: 'n1', width: 40, height: 40, labels: [{ text: '1' }] },
    { id: 'n2', width: 40, height: 40, labels: [{ text: '2' }] },
    { id: 'n3', width: 40, height: 40, labels: [{ text: '3' }] },
    { id: 'n4', width: 40, height: 40, labels: [{ text: '4' }] },
    { id: 'n5', width: 40, height: 40, labels: [{ text: '5' }] },
    { id: 'n6', width: 40, height: 40, labels: [{ text: '6' }] },
    { id: 'n7', width: 40, height: 40, labels: [{ text: '7' }] },
  ],
  edges: [
    { id: 'e12', sources: ['n1'], targets: ['n2'] },
    { id: 'e13', sources: ['n1'], targets: ['n3'] },
    { id: 'e23', sources: ['n2'], targets: ['n3'] },
    { id: 'e24', sources: ['n2'], targets: ['n4'] },
    { id: 'e34', sources: ['n3'], targets: ['n4'] },
    { id: 'e45', sources: ['n4'], targets: ['n5'] },
    { id: 'e46', sources: ['n4'], targets: ['n6'] },
    { id: 'e56', sources: ['n5'], targets: ['n6'] },
    { id: 'e67', sources: ['n6'], targets: ['n7'] },
    { id: 'e57', sources: ['n5'], targets: ['n7'] },
  ],
};
