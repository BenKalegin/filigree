# @filigree/api

Single-call layout facade for [filigree](https://github.com/BenKalegin/filigree) — a TypeScript port of the Eclipse Layout Kernel (ELK) with a first-class human hint system.

Registers every shipped algorithm (`layered`, `force`, `mrtree`, `radial`, `rectpacking`, `stress`) in a singleton default engine. Accepts either an elkjs-style JSON shape or a prebuilt `ElkGraph` so callers can attach hints before layout.

## Install

```bash
pnpm add @filigree/api
```

## Use

```ts
import { layout } from '@filigree/api';

const graph = await layout({
  id: 'root',
  children: [
    { id: 'a', width: 40, height: 30 },
    { id: 'b', width: 40, height: 30 },
  ],
  edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
});
// graph.children[0].x / .y are set.
```

Pick an algorithm with `layoutOptions: { 'elk.algorithm': 'force' }` or the `algorithm` option to `layout()`.

For hints, custom engine wiring, or per-algorithm imports, see the [project README](https://github.com/BenKalegin/filigree#readme).

## License

EPL-2.0. See the project [`LICENSE`](https://github.com/BenKalegin/filigree/blob/main/LICENSE).
