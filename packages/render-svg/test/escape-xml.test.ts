/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, expect, it } from 'vitest';

import { escapeXml } from '../src/escape-xml.js';

describe('escapeXml', () => {
  it('escapes ampersands first to avoid double-encoding', () => {
    expect(escapeXml('foo & bar')).toBe('foo &amp; bar');
    expect(escapeXml('a &amp; b')).toBe('a &amp;amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeXml(`he said "hi"`)).toBe('he said &quot;hi&quot;');
    expect(escapeXml(`it's`)).toBe('it&apos;s');
  });

  it('returns plain strings unchanged', () => {
    expect(escapeXml('Hello, world')).toBe('Hello, world');
    expect(escapeXml('')).toBe('');
  });
});
