# @filigree/alg-force

Fruchterman-Reingold force-directed graph layout for [filigree](https://github.com/BenKalegin/filigree).

Simulates repulsion between every pair of nodes and attraction along every edge, with a cooling schedule so later iterations make smaller moves. Initial placement is a deterministic golden-angle spiral — same input always produces the same output.

Optional Barnes-Hut approximation (`elk.force.useBarnesHut: true`) replaces the exact O(n²) repulsion with a quadtree walk for O(n log n) per iteration. Visually indistinguishable from exact for `theta ≤ 0.7` on graphs of dozens of nodes.

## Install

```bash
pnpm add @filigree/alg-force @filigree/core @filigree/graph
```

## Use

```ts
import { createDefaultForceAlgorithm } from '@filigree/alg-force';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@filigree/core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultForceAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
```

Set `layoutOptions: { 'elk.algorithm': 'force' }` on the graph.

## Options

- `elk.force.iterations` (default 100)
- `elk.force.area` (default 90 000) — drives the ideal edge length
- `elk.force.idealLength` (default 80) — explicit override
- `elk.force.useBarnesHut` (default false)
- `elk.force.barnesHutTheta` (default 0.7)

## License

EPL-2.0. Derived from `org.eclipse.elk.alg.force` — original Kiel University copyright preserved per EPL §3.1(c).
