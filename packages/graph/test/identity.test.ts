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
