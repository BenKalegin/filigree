# @benkalegin/filigree-alg-mrtree

Reingold-Tilford-style tree layout (Mr.Tree) for [filigree](https://github.com/BenKalegin/filigree).

Reads the graph's edges as parent → child relationships and walks the resulting forest top-down. Leaves are placed left-to-right; internal nodes are centred above their direct children; levels stack vertically. Nodes with no incoming edge become roots; multiple roots lay their subtrees side-by-side.

Not a full Reingold-Tilford yet — subtree-overlap correction is a future iteration. Adequate for moderate trees with comparable-width subtrees.

## Install

```bash
pnpm add @benkalegin/filigree-alg-mrtree @benkalegin/filigree-core @benkalegin/filigree-graph
```

## Use

```ts
import { createDefaultMrTreeAlgorithm } from '@benkalegin/filigree-alg-mrtree';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@benkalegin/filigree-core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultMrTreeAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
```

Set `layoutOptions: { 'elk.algorithm': 'mrtree' }` on the graph.

## Options

- `elk.mrtree.spacing.level` (default 60)
- `elk.mrtree.spacing.sibling` (default 30)

## License

EPL-2.0. Derived from `org.eclipse.elk.alg.mrtree` — original Kiel University copyright preserved per EPL §3.1(c).
