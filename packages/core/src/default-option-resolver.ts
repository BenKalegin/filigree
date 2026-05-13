/**
 * Default resolver with hierarchical inheritance.
 *
 * For a query `resolve(option, on)`:
 *   1. If `on` has the property explicitly set, return that.
 *   2. Otherwise walk up the parent chain — only `INode` carries a `parent`
 *      reference in the current data model, so ports/labels/edges resolve
 *      at element-level only.
 *   3. If no ancestor has the property set, return the property's
 *      `defaultValue`.
 *
 * Letting users set `elk.padding`, `elk.algorithm`, etc. once on the root
 * graph and have descendants inherit is the standard ELK semantic.
 */

import { type IGraphElement, isNode } from '@filigree/graph';

import { type IOption, type IOptionResolver } from './i-option.js';

export class DefaultOptionResolver implements IOptionResolver {
  public resolve<T>(option: IOption<T>, on: IGraphElement): T {
    let current: IGraphElement | null = on;
    while (current !== null) {
      if (current.hasProperty(option.property)) {
        return current.getProperty(option.property);
      }
      current = isNode(current) ? current.parent : null;
    }
    return option.property.defaultValue;
  }
}
