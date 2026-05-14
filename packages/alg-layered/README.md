# @filigree/alg-layered

Sugiyama-style top-to-bottom layered layout for [filigree](https://github.com/BenKalegin/filigree). The default composition runs:

1. Greedy cycle breaker
2. Longest-path layer assignment (or `NetworkSimplexLayerer` for tighter layers)
3. Long-edge splitter — dummy nodes thread multi-layer edges through intermediate rows
4. Barycenter crossing minimization
5. 4-alignment Brandes-Köpf node placement, median-combined
6. Two-bend orthogonal edge routing (with hyperedge junction routing)

Each phase is injected. Swap any of them in `LayeredAlgorithm`'s constructor without changing the pipeline.

## Install

```bash
pnpm add @filigree/alg-layered @filigree/core @filigree/graph
```

## Use

```ts
import { createDefaultLayeredAlgorithm } from '@filigree/alg-layered';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@filigree/core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultLayeredAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
await engine.layout(graph);
```

Or set `layoutOptions: { 'elk.algorithm': 'layered' }` on the graph and use the `@filigree/api` facade.

The default composition is also hint-aware — see [`@filigree/hints`](https://www.npmjs.com/package/@filigree/hints).

## License

EPL-2.0. The pipeline phases are direct ports of ELK Java sources; each file carries the original Kiel University copyright per EPL §3.1(c).
