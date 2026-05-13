/**
 * Force-directed layout (Fruchterman-Reingold style).
 *
 * Iteratively simulates:
 *   - repulsion between every pair of nodes        f_rep(d) = k² / d
 *   - attraction along every edge                  f_att(d) = d² / k
 *
 * `k` is the ideal edge length, derived from the configured target area and
 * the node count. Each iteration computes per-node displacements, applies
 * them clamped to the current "temperature", then cools the temperature so
 * later iterations make smaller moves and the layout converges.
 *
 * Initial placement is a deterministic spiral around (0, 0) so the same
 * input always produces the same output — useful for tests and for users
 * who want reproducible diagrams. A future option will allow injecting a
 * seeded RNG for "natural-looking" starts.
 */

import { type IEdge, type INode, isNode } from '@filigree/graph';
import { type ILayoutAlgorithm, type ILayoutContext } from '@filigree/core';

import { ForceOptions } from './force-options.js';

export const FORCE_ALGORITHM_ID = 'force';
export const FORCE_DISPLAY_NAME = 'Force-directed';

const INITIAL_TEMPERATURE_FACTOR = 0.1;
const COOLING_RATE = 0.95;
const MIN_DISTANCE = 0.001;
// Golden angle in radians: π × (3 − √5). Produces an even spiral distribution
// without needing a pseudo-random generator.
const GOLDEN_ANGLE_OFFSET = 3;
const GOLDEN_ANGLE_RADICAND = 5;
const SPIRAL_ANGLE_STEP = Math.PI * (GOLDEN_ANGLE_OFFSET - Math.sqrt(GOLDEN_ANGLE_RADICAND));

// Mutable per-node accumulator. Distinct from `IPoint` (which is readonly),
// so we declare it locally rather than reusing the graph's coordinate type.
interface IDisplacement {
  x: number;
  y: number;
}

export class ForceDirectedAlgorithm implements ILayoutAlgorithm {
  public readonly id = FORCE_ALGORITHM_ID;
  public readonly displayName = FORCE_DISPLAY_NAME;

  public run(context: ILayoutContext): Promise<void> {
    const nodes = context.graph.children;
    if (nodes.length === 0) {
      return Promise.resolve();
    }
    const settings = this.readSettings(context);
    this.placeInitial(nodes, settings.idealLength);
    const displacements = new Map<INode, IDisplacement>(nodes.map((n) => [n, { x: 0, y: 0 }]));
    let temperature = Math.sqrt(settings.area) * INITIAL_TEMPERATURE_FACTOR;
    for (let i = 0; i < settings.iterations; i++) {
      this.resetDisplacements(displacements);
      this.addRepulsiveForces(nodes, displacements, settings.idealLength);
      this.addAttractiveForces(context.graph.containedEdges, displacements, settings.idealLength);
      this.applyDisplacements(nodes, displacements, temperature);
      temperature *= COOLING_RATE;
    }
    return Promise.resolve();
  }

  private readSettings(context: ILayoutContext): IForceSettings {
    return {
      iterations: context.options.resolve(ForceOptions.iterations, context.graph),
      area: context.options.resolve(ForceOptions.area, context.graph),
      idealLength: context.options.resolve(ForceOptions.idealLength, context.graph),
    };
  }

  private placeInitial(nodes: readonly INode[], idealLength: number): void {
    for (const [index, node] of nodes.entries()) {
      const radius = idealLength * Math.sqrt(index + 1);
      const angle = index * SPIRAL_ANGLE_STEP;
      node.setPosition(radius * Math.cos(angle), radius * Math.sin(angle));
    }
  }

  private resetDisplacements(map: ReadonlyMap<INode, IDisplacement>): void {
    for (const d of map.values()) {
      d.x = 0;
      d.y = 0;
    }
  }

  private addRepulsiveForces(
    nodes: readonly INode[],
    displacements: ReadonlyMap<INode, IDisplacement>,
    k: number,
  ): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[i];
        const v = nodes[j];
        if (u === undefined || v === undefined) {
          continue;
        }
        this.applyRepulsion(u, v, displacements, k);
      }
    }
  }

  private applyRepulsion(
    u: INode,
    v: INode,
    displacements: ReadonlyMap<INode, IDisplacement>,
    k: number,
  ): void {
    const dx = u.x + u.width / 2 - (v.x + v.width / 2);
    const dy = u.y + u.height / 2 - (v.y + v.height / 2);
    const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
    const force = (k * k) / dist;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    applyForce(displacements, u, fx, fy);
    applyForce(displacements, v, -fx, -fy);
  }

  private addAttractiveForces(
    edges: readonly IEdge[],
    displacements: ReadonlyMap<INode, IDisplacement>,
    k: number,
  ): void {
    for (const edge of edges) {
      const [source, ...moreSources] = edge.sources;
      const [target, ...moreTargets] = edge.targets;
      if (
        source === undefined ||
        target === undefined ||
        moreSources.length > 0 ||
        moreTargets.length > 0
      ) {
        continue;
      }
      if (!isNode(source) || !isNode(target)) {
        continue;
      }
      const dx = source.x + source.width / 2 - target.x - target.width / 2;
      const dy = source.y + source.height / 2 - target.y - target.height / 2;
      const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      applyForce(displacements, source, -fx, -fy);
      applyForce(displacements, target, fx, fy);
    }
  }

  private applyDisplacements(
    nodes: readonly INode[],
    displacements: ReadonlyMap<INode, IDisplacement>,
    temperature: number,
  ): void {
    for (const node of nodes) {
      const d = displacements.get(node);
      if (d === undefined) {
        continue;
      }
      const magnitude = Math.max(Math.hypot(d.x, d.y), MIN_DISTANCE);
      const limited = Math.min(magnitude, temperature);
      node.setPosition(node.x + (d.x / magnitude) * limited, node.y + (d.y / magnitude) * limited);
    }
  }
}

interface IForceSettings {
  readonly iterations: number;
  readonly area: number;
  readonly idealLength: number;
}

const applyForce = (
  displacements: ReadonlyMap<INode, IDisplacement>,
  node: INode,
  fx: number,
  fy: number,
): void => {
  const d = displacements.get(node);
  if (d === undefined) {
    return;
  }
  d.x += fx;
  d.y += fy;
};
