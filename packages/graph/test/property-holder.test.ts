import { describe, expect, it } from 'vitest';

import { defineProperty } from '../src/property.js';
import { PropertyHolder } from '../src/property-holder.js';

describe('PropertyHolder', () => {
  const algorithm = defineProperty<string>({ id: 'elk.algorithm', defaultValue: 'layered' });
  const padding = defineProperty<number>({ id: 'elk.padding', defaultValue: 10 });

  it('returns the default value when a property is unset', () => {
    const holder = new PropertyHolder();
    expect(holder.getProperty(algorithm)).toBe('layered');
    expect(holder.hasProperty(algorithm)).toBe(false);
  });

  it('returns the explicitly set value', () => {
    const holder = new PropertyHolder();
    holder.setProperty(algorithm, 'force');
    expect(holder.getProperty(algorithm)).toBe('force');
    expect(holder.hasProperty(algorithm)).toBe(true);
  });

  it('keeps unrelated properties independent', () => {
    const holder = new PropertyHolder();
    holder.setProperty(algorithm, 'mrtree');
    expect(holder.getProperty(padding)).toBe(10);
  });

  it('exposes set entries via propertyEntries', () => {
    const holder = new PropertyHolder();
    holder.setProperty(algorithm, 'radial');
    holder.setProperty(padding, 25);
    const entries = holder.propertyEntries();
    expect(entries).toHaveLength(2);
    expect(new Map(entries).get(algorithm.id)).toBe('radial');
    expect(new Map(entries).get(padding.id)).toBe(25);
  });
});
