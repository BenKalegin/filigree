# @benkalegin/filigree-hints

Human hint subsystem for [filigree](https://github.com/BenKalegin/filigree) — a way for an end user authoring a diagram to nudge specific layout decisions without writing algorithm code. Filigree's deliberate divergence from upstream ELK.

Hint kinds:

- `PinPosition(id, x, y)` — post-layout: override a node's position.
- `Focus(id, [cx, cy])` — post-layout: translate the whole graph so the named node centers at `(cx, cy)`.
- `SameLayer(a, b)` — in-layout (layered): force two nodes onto the same row.
- `OrderBefore(a, b)` — in-layout (layered): force `a` to sit left of `b` within their layer.
- `Group([ids])` — in-layout (layered): cluster a set of siblings contiguously.

Hints are soft constraints — algorithms that don't recognize a kind silently ignore it.

## Install

```bash
pnpm add @benkalegin/filigree-hints
```

## Use

```ts
import { attachHints, sameLayer, orderBefore } from '@benkalegin/filigree-hints';
import { fromJson } from '@benkalegin/filigree-graph';

const graph = fromJson({ id: 'root', children: [...], edges: [...] });
attachHints(graph, [
  sameLayer('validate', 'summarize'),
  orderBefore('yes_branch', 'no_branch'),
]);
await engine.layout(graph);
```

Full reference: [`docs/hints.md`](https://github.com/BenKalegin/filigree/blob/main/docs/hints.md).

## License

EPL-2.0.
