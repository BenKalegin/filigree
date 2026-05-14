# @filigree/alg-radial

Radial concentric-tree layout for [filigree](https://github.com/BenKalegin/filigree).

The root sits at the centre; each subsequent level lives on a circle of increasing radius. Children of a node share their parent's angular slice. Good for hub-and-spoke diagrams.

## Install

```bash
pnpm add @filigree/alg-radial @filigree/core @filigree/graph
```

## Use

```ts
import { createDefaultRadialAlgorithm } from '@filigree/alg-radial';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@filigree/core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultRadialAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
```

Set `layoutOptions: { 'elk.algorithm': 'radial' }` on the graph.

## License

EPL-2.0. Derived from `org.eclipse.elk.alg.radial` — original Kiel University copyright preserved per EPL §3.1(c).
