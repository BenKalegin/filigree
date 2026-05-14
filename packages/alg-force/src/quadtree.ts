/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Tiny region quadtree used by the Barnes–Hut approximation of pairwise
 * repulsion in the force-directed layout.
 *
 * The tree is built once per iteration over the current node positions:
 *   - Each internal region knows its square bounding box, its centre of
 *     mass (average position of contained points), and its mass (point
 *     count).
 *   - Each leaf either holds zero or one points.
 *
 * Force lookup: walk the tree top-down. If a region is "far enough"
 * (`regionSize / distance < theta`) the region is approximated as a
 * single point at its centre of mass; otherwise recurse into its four
 * children. Yields O(n log n) total work over all source nodes instead
 * of the exact O(n²) sum.
 */

export interface IQuadPoint {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

export class QuadTree {
  public readonly minX: number;
  public readonly minY: number;
  public readonly size: number;
  public mass = 0;
  public massCenterX = 0;
  public massCenterY = 0;
  public point: IQuadPoint | undefined;
  public children: QuadTree[] | undefined;

  constructor(minX: number, minY: number, size: number) {
    this.minX = minX;
    this.minY = minY;
    this.size = size;
  }

  public insert(p: IQuadPoint): void {
    this.accumulateMass(p);
    if (this.point === undefined && this.children === undefined) {
      this.point = p;
      return;
    }
    if (this.children === undefined) {
      const existing = this.point;
      this.point = undefined;
      this.children = this.subdivide();
      if (existing !== undefined) this.pickChild(existing).insert(existing);
    }
    this.pickChild(p).insert(p);
  }

  private accumulateMass(p: IQuadPoint): void {
    const totalMass = this.mass + 1;
    this.massCenterX = (this.massCenterX * this.mass + p.x) / totalMass;
    this.massCenterY = (this.massCenterY * this.mass + p.y) / totalMass;
    this.mass = totalMass;
  }

  private subdivide(): QuadTree[] {
    const half = this.size / 2;
    return [
      new QuadTree(this.minX, this.minY, half),
      new QuadTree(this.minX + half, this.minY, half),
      new QuadTree(this.minX, this.minY + half, half),
      new QuadTree(this.minX + half, this.minY + half, half),
    ];
  }

  private pickChild(p: IQuadPoint): QuadTree {
    if (this.children === undefined) {
      throw new Error('pickChild called on a leaf quadtree node');
    }
    const half = this.size / 2;
    const right = p.x >= this.minX + half;
    const bottom = p.y >= this.minY + half;
    const idx = (bottom ? 2 : 0) + (right ? 1 : 0);
    const child = this.children[idx];
    if (child === undefined) throw new Error('quadtree child slot is missing');
    return child;
  }
}

export const buildQuadTree = (points: readonly IQuadPoint[]): QuadTree | undefined => {
  if (points.length === 0) return undefined;
  const bounds = computeBounds(points);
  const root = new QuadTree(bounds.minX, bounds.minY, bounds.size);
  for (const p of points) root.insert(p);
  return root;
};

const MIN_SIZE = 1;

const computeBounds = (
  points: readonly IQuadPoint[],
): { minX: number; minY: number; size: number } => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  // Square the bounds so a `size / distance` comparison is meaningful in
  // either dimension. The +ε ensures every point is strictly inside the
  // root region.
  const size = Math.max(maxX - minX, maxY - minY, MIN_SIZE) * (1 + Number.EPSILON);
  return { minX, minY, size };
};
