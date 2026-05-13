/**
 * Base shape shared by every graph element (node, edge, port, label).
 *
 * Lives at the root of the interface hierarchy so observers, traversers, and
 * the property system can operate generically. Anything more specific (sources,
 * targets, children, …) belongs on the subtype.
 */

import { type GraphElementId } from './identity.js';
import { type IPropertyHolder } from './property.js';

export interface IGraphElement extends IPropertyHolder {
  readonly id: GraphElementId;
}
