/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';

import { toGraphElementId } from '../src/identity.js';

describe('toGraphElementId', () => {
  it('preserves the underlying string value', () => {
    expect(toGraphElementId('node-1')).toBe('node-1');
  });

  it('is idempotent', () => {
    const id = toGraphElementId('node-1');
    expect(toGraphElementId(id)).toBe(id);
  });
});
