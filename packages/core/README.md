# @benkalegin/filigree-core

Layout engine, algorithm registry, option resolver, and observer dispatch for [filigree](https://github.com/BenKalegin/filigree).

This is the substrate every algorithm package plugs into. Most users want `@benkalegin/filigree-api` instead — this package is for hosts that need to compose a custom engine.

## Install

```bash
pnpm add @benkalegin/filigree-core @benkalegin/filigree-graph
```

## Use

```ts
import {
  DefaultAlgorithmRegistry,
  DefaultLayoutEngine,
  DefaultOptionResolver,
} from '@benkalegin/filigree-core';
import { createDefaultLayeredAlgorithm } from '@benkalegin/filigree-alg-layered';

const registry = new DefaultAlgorithmRegistry();
registry.register(createDefaultLayeredAlgorithm());
const engine = new DefaultLayoutEngine(registry, new DefaultOptionResolver());
await engine.layout(graph);
```

Attach observers to trace algorithm + phase events:

```ts
const observer = {
  onAlgorithmStarted: (algo, ctx) => { /* … */ },
  onPhase: (event, phaseId, ctx) => { /* … */ },
};
new DefaultLayoutEngine(registry, resolver, [observer]);
```

See the [project README](https://github.com/BenKalegin/filigree#readme) for the full picture.

## License

EPL-2.0.
