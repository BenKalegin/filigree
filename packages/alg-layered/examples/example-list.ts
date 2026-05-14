/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Catalogue of example entries rendered by `generate-docs.ts`.
 *
 * Kept in its own file so `generate-docs.ts` stays small. The `IExample`
 * shape is the contract between the catalogue and the renderer: graph
 * fixture + engine factory + (optional) hint sets and render overrides.
 */

import { type ILayoutEngine } from '@benkalegin/filigree-core';
import {
  type IEdge,
  type IJsonGraph,
  type INode,
} from '@benkalegin/filigree-graph';
import { group, type IHint, orderBefore, pinPosition, sameLayer } from '@benkalegin/filigree-hints';
import {
  type IEdgeStyleOverride,
  type INodeStyleOverride,
  type IRenderOptions,
} from '@benkalegin/filigree-render-svg';

import {
  BalancedNodePlacer,
  BrandesKopfNodePlacer,
  LinearNodePlacer,
} from '../src/index.js';
import {
  BIDIRECTIONAL,
  COMPOUND,
  CYCLIC,
  FAN_OUT,
  FLOWCHART,
  ORGANIC,
  RADIAL_TREE,
  TIGHT_COMPOUND,
  TREE,
  UNEVEN_BRANCHES,
} from './example-fixtures.js';
import { CARDS, HYPEREDGE_MERGE, MESH } from './example-fixtures-extra.js';
import {
  buildForceEngine,
  buildHintAwareLayeredEngine,
  buildLayeredEngine,
  buildMrTreeEngine,
  buildRadialEngine,
  buildRectPackingEngine,
  buildStressEngine,
} from './example-engines.js';

export interface IExample {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly graph: IJsonGraph;
  readonly buildEngine: () => ILayoutEngine;
  readonly renderOptions?: Partial<IRenderOptions>;
  // Read by hint-aware phases *during* layout.
  readonly preLayoutHints?: readonly IHint[];
  // Applied *after* layout by applyHints (e.g. PinPosition).
  readonly hints?: readonly IHint[];
}

const PINNED_X = 200;
const PINNED_Y = 200;

const styledNodes = (node: INode): INodeStyleOverride | undefined => {
  if (node.id === 'decision') return { fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2 };
  if (node.id === 'end') return { fill: '#dcfce7', stroke: '#15803d', strokeWidth: 2 };
  return undefined;
};

const styledEdges = (edge: IEdge): IEdgeStyleOverride | undefined => {
  const targetId = edge.targets[0]?.id ?? '';
  if (targetId === 'no_branch' || targetId === 'process_no') {
    return { stroke: '#dc2626', strokeDasharray: '5 3' };
  }
  return undefined;
};

export const EXAMPLES: readonly IExample[] = [
  {
    slug: 'layered-default',
    title: 'Layered (default)',
    description:
      'Classic top-to-bottom flowchart. Default composition: greedy cycle breaker, longest-path layer assignment, barycenter crossing minimization, Brandes-Köpf node placement, two-bend orthogonal edge routing.',
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'layered-balanced',
    title: 'Layered with BalancedNodePlacer',
    description:
      'Same flowchart, simpler placer: linear initial placement then a single-pass median balance.',
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new BalancedNodePlacer()),
  },
  {
    slug: 'layered-linear',
    title: 'Layered with LinearNodePlacer',
    description:
      'Simplest placer — every node at its `indexInLayer * spacing`. Reveals what a pre-balancing layout looks like.',
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new LinearNodePlacer()),
  },
  {
    slug: 'layered-cyclic',
    title: 'Layered on a cyclic graph',
    description:
      'Demonstrates the greedy cycle breaker. The back edge (fix → check) is reversed for layering so longest-path treats the graph as a DAG.',
    graph: CYCLIC,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'layered-compound',
    title: 'Layered with a compound node',
    description:
      'Hierarchical layout. The engine recurses bottom-up: the sub-flow is laid out first, the compound is sized from its children, then the top level lays out preamble → sub-flow → finale.',
    graph: COMPOUND,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'layered-bidirectional',
    title: 'Parallel edges (bidirectional pair)',
    description:
      'Two edges between the same node pair. The router groups parallel edges, leaves one along the natural column, and detours the other through a side offset (LayeredOptions.parallelEdgeOffset). Without the offset both lines would trace the same vertical column.',
    graph: BIDIRECTIONAL,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'layered-compound-tight',
    title: 'Compound with custom padding (elk.padding = 4)',
    description:
      'Same compound topology as above but the root sets `elk.padding: 4`. Inheritance walks the parent chain in DefaultOptionResolver, so the sub-flow compound picks up the tighter padding without an explicit override.',
    graph: TIGHT_COMPOUND,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'layered-themed',
    title: 'Flowchart with label backgrounds',
    description:
      'Same flowchart, rendered with `labelBackground: "#fef3c7"`. The renderer emits a backing rect behind every label so wider text remains readable over busy edges or narrow nodes.',
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
    renderOptions: { labelBackground: '#fef3c7' },
  },
  {
    slug: 'layered-styled',
    title: 'Render polish — corner radius, dashed edges, per-element theming',
    description:
      "Same flowchart, rendered with `nodeCornerRadius: 10` plus per-element `nodeStyle` / `edgeStyle` callbacks. The `decision` node draws in a warning palette, the `end` node in a success palette, and any edge whose target id starts with `no_` or `process_no` draws dashed to visually mark the error branch. The base style still applies to nodes/edges the callbacks don't touch.",
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
    renderOptions: {
      nodeCornerRadius: 10,
      nodeStyle: styledNodes,
      edgeStyle: styledEdges,
    },
  },
  {
    slug: 'mrtree-project',
    title: 'Mr.Tree (tree layout)',
    description:
      'Reingold-Tilford-style tree placement. Leaves are placed left-to-right, internal nodes are centred above their direct children, levels stack vertically. Reads edges as parent → child; nodes with no incoming edge are treated as roots.',
    graph: TREE,
    buildEngine: buildMrTreeEngine,
  },
  {
    slug: 'radial-architecture',
    title: 'Radial (concentric tree)',
    description:
      "A hub-and-spoke architecture diagram. The root sits at the centre; each subsequent level lives on a circle of increasing radius. Children of a node share their parent's angular slice.",
    graph: RADIAL_TREE,
    buildEngine: buildRadialEngine,
  },
  {
    slug: 'force-organic',
    title: 'Force-directed',
    description:
      'Fruchterman-Reingold. Deterministic spiral start, 100 iterations with cooling. Connected nodes converge to roughly equal spring lengths; the graph forms two triangles linked by one edge.',
    graph: ORGANIC,
    buildEngine: buildForceEngine,
  },
  {
    slug: 'layered-pinned',
    title: 'Layered + human hint (pin position)',
    description:
      "The 12-node flowchart laid out with the default layered pipeline, then post-processed by `applyHints`. A `pinPosition` hint locks `decision` at a custom coordinate. The rest of the graph keeps its algorithm-computed placement; only the pinned node moves. Edges already routed through the pinned node aren't re-routed — a deliberate known artefact for this first hint POC.",
    graph: FLOWCHART,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
    hints: [pinPosition('decision', PINNED_X, PINNED_Y)],
  },
  {
    slug: 'layered-same-layer',
    title: 'Layered + human hint (same layer)',
    description:
      'Two branches of unequal length share a root. Longest-path places `left_leaf` one layer above `right_leaf`, leaving the two terminations on different rows. A `sameLayer(left_leaf, right_leaf)` hint asks `HintAwareLayerer` to push both leaves to `max(layer)` so they line up at the bottom. The layer partition is rebuilt after longest-path; downstream crossing minimization keeps the columns sensible.',
    graph: UNEVEN_BRANCHES,
    buildEngine: buildHintAwareLayeredEngine,
    preLayoutHints: [sameLayer('left_leaf', 'right_leaf')],
  },
  {
    slug: 'layered-order-before',
    title: 'Layered + human hint (order before)',
    description:
      "Same flowchart. A `orderBefore('no_branch', 'yes_branch')` hint flips the two `decision` children so 'No' shows up on the left. `HintAwareCrossingMinimizer` wraps barycenter; the swap happens after the barycenter sweep, overriding whichever order minimization picked.",
    graph: FLOWCHART,
    buildEngine: buildHintAwareLayeredEngine,
    preLayoutHints: [orderBefore('no_branch', 'yes_branch')],
  },
  {
    slug: 'layered-group',
    title: 'Layered + human hint (group)',
    description:
      "A five-task fan-out / fan-in pipeline. A `group(['task_a', 'task_c', 'task_e'])` hint clusters the three odd-named tasks together in their layer — `HintAwareCrossingMinimizer` re-packs the layer after barycenter so group members occupy a contiguous run starting at the leftmost member's slot. Useful for keeping related siblings together when the algorithm has no other reason to favor that arrangement.",
    graph: FAN_OUT,
    buildEngine: buildHintAwareLayeredEngine,
    preLayoutHints: [group(['task_a', 'task_c', 'task_e'])],
  },
  {
    slug: 'layered-hyperedge',
    title: 'Layered + hyperedges (multi-source / multi-target)',
    description:
      "Three producers fan into one merge step via a single hyperedge (`sources: ['producer_a', 'producer_b', 'producer_c']`), and the merge fans out to two consumers via another hyperedge. The orthogonal router emits one route segment per branch — every branch meets at a shared junction point on the y-midline between the source and target layers. Simple one-to-one edges still use the classic two-bend route.",
    graph: HYPEREDGE_MERGE,
    buildEngine: () => buildLayeredEngine(new BrandesKopfNodePlacer()),
  },
  {
    slug: 'rectpacking-cards',
    title: 'Rectpacking (shelf packing)',
    description:
      'Twelve cards of varied sizes packed into a compact rectangle. Edges are ignored — rectpacking only positions rectangles. Sort by descending area, then place each card on the current shelf if it fits within the target width (derived from `sqrt(totalArea × aspectRatio)`), otherwise start a new shelf below.',
    graph: CARDS,
    buildEngine: buildRectPackingEngine,
  },
  {
    slug: 'stress-mesh',
    title: 'Stress (majorization)',
    description:
      'A small mesh of seven nodes laid out by stress majorization. Each iteration shifts every node toward a position that minimizes Σ wᵢⱼ(‖xᵢ−xⱼ‖−dᵢⱼ)², where dᵢⱼ is the graph-theoretic distance scaled by `desiredEdgeLength` and wᵢⱼ = 1/dᵢⱼ². Adjacent nodes end up close, multi-hop nodes spread out proportionally.',
    graph: MESH,
    buildEngine: buildStressEngine,
  },
];
