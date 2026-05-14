# @filigree/alg-rectpacking

Shelf-packing layout for edge-free rectangle collections — [filigree](https://github.com/BenKalegin/filigree)'s "card grid" algorithm.

Sort by descending area, walk in order, place each card on the current shelf if it fits within the target row width (derived from `sqrt(totalArea × aspectRatio)`), otherwise break to a new shelf below. Linear time. Edges are ignored entirely.

Far simpler than ELK's full three-phase rectpacking (width approximation → packing → whitespace elimination) — that remains a future iteration. Produces acceptable layouts for the common "dashboard of similar-sized cards" shape.

## Install

```bash
pnpm add @filigree/alg-rectpacking @filigree/core @filigree/graph
```

## Use

```ts
import { createDefaultRectPackingAlgorithm } from '@filigree/alg-rectpacking';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@filigree/core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultRectPackingAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
```

Set `layoutOptions: { 'elk.algorithm': 'rectpacking' }` on the graph.

## Options

- `elk.rectpacking.spacing.node` (default 10)
- `elk.rectpacking.aspectRatio` (default 1.6)

## License

EPL-2.0. Derived from `org.eclipse.elk.alg.rectpacking` — original Kiel University copyright preserved per EPL §3.1(c).
