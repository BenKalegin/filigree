# @benkalegin/filigree-alg-stress

Stress-majorization graph layout for [filigree](https://github.com/BenKalegin/filigree).

Minimizes the stress functional `Σ wᵢⱼ (‖xᵢ − xⱼ‖ − dᵢⱼ)²` where `dᵢⱼ` is the graph-theoretic distance (hop count) scaled by `desiredEdgeLength` and `wᵢⱼ = 1 / dᵢⱼ²`. Adjacent nodes converge to roughly `desiredEdgeLength` apart while multi-hop pairs stretch proportionally.

Disconnected components handled by clamping infinite hop distances to the diameter of the largest component plus one — disjoint sub-graphs settle into distinct clusters. Initial placement is a deterministic golden-angle spiral so output is reproducible.

## Install

```bash
pnpm add @benkalegin/filigree-alg-stress @benkalegin/filigree-core @benkalegin/filigree-graph
```

## Use

```ts
import { createDefaultStressAlgorithm } from '@benkalegin/filigree-alg-stress';
import { DefaultAlgorithmRegistry, DefaultLayoutEngine, DefaultOptionResolver } from '@benkalegin/filigree-core';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultStressAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
```

Set `layoutOptions: { 'elk.algorithm': 'stress' }` on the graph.

## Options

- `elk.stress.desiredEdgeLength` (default 80)
- `elk.stress.iterations` (default 80)

## License

EPL-2.0. Derived from `org.eclipse.elk.alg.force/stress` — original Kiel University copyright preserved per EPL §3.1(c).
