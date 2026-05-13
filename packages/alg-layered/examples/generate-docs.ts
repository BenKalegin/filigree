/**
 * Generates `docs/layout-examples.md` and the SVG files under `docs/examples/`
 * that it references. Run via `pnpm --filter @filigree/alg-layered generate-docs`.
 *
 * Each example pairs a graph fixture (from `example-fixtures.ts`) with an
 * engine wiring that registers a specific algorithm or strategy. The script
 * lays out the graph, renders the result, and emits both the SVG and a
 * matching markdown section.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
  type ILayoutEngine,
} from '@filigree/core';
import { fromJson, type IJsonGraph } from '@filigree/graph';
import { type IRenderOptions, renderSvg } from '@filigree/render-svg';

import {
  BalancedNodePlacer,
  BarycenterCrossingMinimizer,
  BrandesKopfNodePlacer,
  GreedyCycleBreaker,
  type INodePlacer,
  LayeredAlgorithm,
  LayeredContextBuilder,
  LayeredResultApplier,
  LinearNodePlacer,
  LongestPathLayerer,
  OrthogonalEdgeRouter,
} from '../src/index.js';
import {
  BIDIRECTIONAL,
  COMPOUND,
  CYCLIC,
  FLOWCHART,
  ORGANIC,
  TIGHT_COMPOUND,
} from './example-fixtures.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(SCRIPT_DIR, '../../../docs');

interface IExample {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly graph: IJsonGraph;
  readonly buildEngine: () => ILayoutEngine;
  readonly renderOptions?: Partial<IRenderOptions>;
}

const buildLayeredEngine = (nodePlacer: INodePlacer): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(
    new LayeredAlgorithm({
      contextBuilder: new LayeredContextBuilder(),
      cycleBreaker: new GreedyCycleBreaker(),
      layerAssigner: new LongestPathLayerer(),
      crossingMinimizer: new BarycenterCrossingMinimizer(),
      nodePlacer,
      edgeRouter: new OrthogonalEdgeRouter(),
      resultApplier: new LayeredResultApplier(),
    }),
  );
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const buildForceEngine = (): ILayoutEngine => {
  const registry = new DefaultAlgorithmRegistry();
  registry.register(createDefaultForceAlgorithm());
  return new DefaultLayoutEngine(registry, new DefaultOptionResolver());
};

const EXAMPLES: readonly IExample[] = [
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
    slug: 'force-organic',
    title: 'Force-directed',
    description:
      'Fruchterman-Reingold. Deterministic spiral start, 100 iterations with cooling. Connected nodes converge to roughly equal spring lengths; the graph forms two triangles linked by one edge.',
    graph: ORGANIC,
    buildEngine: buildForceEngine,
  },
];

const renderExample = async (example: IExample): Promise<void> => {
  const graph = fromJson(example.graph);
  await example.buildEngine().layout(graph);
  const svg = renderSvg(graph, example.renderOptions ?? {});
  writeFileSync(path.join(DOCS_DIR, 'examples', `${example.slug}.svg`), svg, 'utf8');
};

const generateMarkdown = (examples: readonly IExample[]): string => {
  const intro = [
    '# Layout examples',
    '',
    'Single documented repo of layout approaches. Each section names an algorithm or strategy, explains what it does, and shows the rendered output as an inline image. The SVG files live next to this doc under `examples/` — they are referenced, not duplicated.',
    '',
    'Regenerate with `pnpm --filter @filigree/alg-layered generate-docs`.',
    '',
    '<!-- Generated file — do not edit by hand. -->',
    '',
    '## Index',
    '',
    ...examples.map((e) => `- [${e.title}](#${e.slug})`),
    '',
  ];
  const sections = examples.map(
    (e) => `## ${e.title}\n\n${e.description}\n\n![${e.title}](examples/${e.slug}.svg)\n`,
  );
  return [...intro, ...sections].join('\n');
};

const main = async (): Promise<void> => {
  for (const example of EXAMPLES) {
    await renderExample(example);
  }
  const md = generateMarkdown(EXAMPLES);
  writeFileSync(path.join(DOCS_DIR, 'layout-examples.md'), md, 'utf8');
  console.log(
    `Wrote ${path.join(DOCS_DIR, 'layout-examples.md')} + ${String(EXAMPLES.length)} SVGs under examples/.`,
  );
};

await main();
