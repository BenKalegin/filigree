/**
 * Strategy that arranges a set of rectangles inside a target bounding box.
 *
 * Used by rectpacking and as a fallback by layered when nodes share a region.
 * Concrete arrangers (shelf-packer, polyomino-packer, …) implement this.
 */

import { type IDimensions, type IRect } from '@elk/graph';

export interface IRectangleArranger {
  arrange(rectangles: readonly IRect[], targetSize: IDimensions): readonly IRect[];
}
