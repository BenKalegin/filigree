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

| Algorithm        | Status     | Notes                              |
| ---------------- | ---------- | ---------------------------------- |
| ELK Layered      | _planned_  | Flagship algorithm, top priority   |
| ELK Force        | _planned_  |                                    |
| ELK Stress       | _planned_  |                                    |
| ELK Radial       | _planned_  |                                    |
| ELK Mr.Tree      | _planned_  |                                    |
| ELK Rectpacking  | _planned_  |                                    |
| Human hints      | _planned_  | New subsystem, not in upstream ELK |
| OGDF integration | _excluded_ | GPL-licensed, license incompatible |
| libavoid routing | _excluded_ | LGPL C++, not portable             |

## Installation

```bash
npm install filigree
```

> Note: the unscoped `filigree` name on npm may be taken; the published package may use a scoped name such as `@benkalegin/filigree`.

## Usage

```typescript
import { layout } from "filigree";

const graph = {
  id: "root",
  children: [
    { id: "n1", width: 40, height: 40 },
    { id: "n2", width: 40, height: 40 },
  ],
  edges: [
    { id: "e1", sources: ["n1"], targets: ["n2"] },
  ],
};

const result = await layout(graph, {
  algorithm: "layered",
  direction: "DOWN",
});

console.log(result.children[0].x, result.children[0].y);
```

The input format and layout options follow the [ELK JSON format](https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html) — existing ELK / elkjs users should feel at home.

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
