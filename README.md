# filigree

A pure TypeScript port of the [Eclipse Layout Kernel (ELK)](https://eclipse.dev/elk/) — a collection of graph layout algorithms originally developed in Java at Kiel University — extended with a first-class human hint system.

> **This is a derivative work.** All credit for the algorithms, architecture, and decades of research goes to the ELK project at the Eclipse Foundation and its predecessors (KIELER, KIML, KLay) at Kiel University. See [`NOTICE`](./NOTICE) for full attribution.

## Why this port exists

ELK's JavaScript distribution, [`elkjs`](https://github.com/kieler/elkjs), is produced by transpiling the Java codebase via GWT. It works, but:

- Bundle size is ~1.5 MB minified.
- Stack traces and types reflect the Java origin, not idiomatic TypeScript.
- The default execution model is Web Worker, which is awkward for some embedding scenarios.
- Adding new algorithms or extending the constraint vocabulary requires Java tooling.
- There is no mechanism for an end user (a human authoring the diagram) to nudge layout decisions short of writing new constraints.

`filigree` is a hand-written TypeScript port aimed at:

- Smaller bundle size.
- Native TypeScript types and ergonomics.
- Synchronous and async APIs without forcing Web Workers.
- A foundation for downstream projects that need to extend layout behavior (custom constraints, hint systems, focus modes).
- A **human hint system** that lets authors influence specific layout decisions without writing algorithm code.

## Relationship to upstream ELK

`filigree` tracks ELK's algorithms and behavior for the parts it ports. When upstream ELK fixes a bug or improves a ported algorithm, the change is brought across. Where reasonable, fixes discovered during the port are contributed back to [`eclipse-elk/elk`](https://github.com/eclipse-elk/elk) or [`kieler/elkjs`](https://github.com/kieler/elkjs).

The hint system is a **deliberate divergence** from upstream and is unique to `filigree`. Outside of that, this is a translation that intends to stay faithful, with idiomatic TypeScript as the only deliberate difference.

## Status

| Algorithm        | Status         | Notes                                                                                                                                                           |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ELK Layered      | _implemented_  | Greedy cycle breaker, longest-path layerer, barycenter crossing minimization, dummy-node long-edge routing, Brandes-Köpf placement, two-bend orthogonal router. |
| ELK Force        | _implemented_  | Fruchterman-Reingold; deterministic spiral start, 100 iterations with cooling.                                                                                  |
| ELK Mr.Tree      | _implemented_  | Reingold-Tilford-style tree placement.                                                                                                                          |
| ELK Radial       | _implemented_  | Hub-and-spoke concentric tree.                                                                                                                                  |
| ELK Stress       | _implemented_  | Stress majorization minimizing Σwᵢⱼ(‖xᵢ−xⱼ‖−dᵢⱼ)² with hop-distance targets. Disconnected components handled.                                                  |
| ELK Rectpacking  | _implemented_  | Shelf packing — sort by descending area, place into rows under a target aspect ratio. Edge-free.                                                                |
| Human hints      | _implemented_  | `PinPosition` (post-layout, any algorithm), `SameLayer` / `OrderBefore` / `Group` (in-layout, layered). See [`docs/hints.md`](./docs/hints.md). Not in upstream ELK. |
| OGDF integration | _excluded_     | GPL-licensed, license incompatible                                                                                                                              |
| libavoid routing | _excluded_     | LGPL C++, not portable                                                                                                                                          |

See [`docs/layout-examples.md`](./docs/layout-examples.md) for rendered SVG previews of every algorithm and hint currently shipped.

## Installation

```bash
# (not yet published — install from source for now)
git clone https://github.com/BenKalegin/filigree.git
cd filigree
pnpm install
```

The workspace is split into scoped packages: graph model (`@filigree/graph`), engine + options (`@filigree/core`), algorithms (`@filigree/alg-layered`, `@filigree/alg-force`, `@filigree/alg-mrtree`, `@filigree/alg-radial`, `@filigree/alg-rectpacking`, `@filigree/alg-stress`), hints (`@filigree/hints`), renderer (`@filigree/render-svg`), and a one-call facade (`@filigree/api`). Every source file carries an EPL-2.0 header — files derived from a specific ELK Java class preserve the original Kiel University copyright per EPL §3.1(c).

## Usage

The simplest entry point is the `@filigree/api` facade:

```typescript
import { layout } from "@filigree/api";
import { renderSvg } from "@filigree/render-svg";

const graph = await layout({
  id: "root",
  children: [
    { id: "n1", width: 40, height: 40 },
    { id: "n2", width: 40, height: 40 },
  ],
  edges: [{ id: "e1", sources: ["n1"], targets: ["n2"] }],
});

// Positions are set on graph.children[*].x / .y; render if you want SVG.
const svg = renderSvg(graph);
```

Select a different algorithm via `layoutOptions: { 'elk.algorithm': 'force' }` (`force` | `mrtree` | `radial` | `layered` | `rectpacking` | `stress`).

Attach human hints before layout:

```typescript
import { attachHints, group, orderBefore, sameLayer } from "@filigree/hints";
import { fromJson } from "@filigree/graph";
import { layout } from "@filigree/api";

const graph = fromJson({ id: "root", children: [...], edges: [...] });
attachHints(graph, [
  sameLayer("validate", "summarize"),
  orderBefore("yes_branch", "no_branch"),
  group(["task_a", "task_c", "task_e"]),
]);
await layout(graph);
```

For explicit engine wiring (custom strategy combinations, per-phase overrides), use `DefaultLayoutEngine` directly — see `packages/alg-layered/examples/example-engines.ts` for the patterns.

The input format follows the [ELK JSON format](https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html) — existing ELK / elkjs users should feel at home.

## License

`filigree` is licensed under the **Eclipse Public License 2.0**, the same license as the original ELK. See [`LICENSE`](./LICENSE) for the full text and [`NOTICE`](./NOTICE) for attribution details.

### What this means for you

- **Use in commercial products:** Yes, freely. Including proprietary products.
- **Modify and redistribute:** Yes, as long as your modifications to `filigree` itself remain under EPL-2.0 and you make the source available.
- **Use as a library from code under another license** (MIT, Apache, proprietary, etc.): Yes. The EPL copyleft applies at the file level, not the project level. Calling `filigree` from your own code does not affect your code's license.
- **Re-license `filigree` as MIT / Apache:** No. The port is a derivative work of EPL-2.0 code and stays under EPL-2.0.

If you need a non-EPL implementation, a clean-room rewrite from ELK's published papers (starting with [arXiv:2311.00533](https://arxiv.org/abs/2311.00533)) is the only legal path.

## Contributing

Contributions welcome. By submitting a pull request you agree that your contribution is licensed under EPL-2.0.

If you are fixing a bug that also exists in upstream ELK, please consider opening an issue on `eclipse-elk/elk` so the fix can land upstream too.

## Acknowledgments

This work would not exist without the 15+ years of research and engineering invested in ELK by the KIELER team at Kiel University and contributors to the Eclipse Foundation project. The arXiv paper [_The Eclipse Layout Kernel_](https://arxiv.org/abs/2311.00533) by Domrös et al. is highly recommended reading for anyone working on or with `filigree`.
