# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-14

First public release. The package versions across the workspace move together.

### Algorithms

- **Layered** (`@filigree/alg-layered`) — greedy cycle breaker, longest-path layerer (plus an opt-in `NetworkSimplexLayerer` for tighter layers), dummy-node long-edge splitter (handles forward *and* reversed back edges), barycenter crossing minimization, full 4-alignment Brandes-Köpf node placement with median combine, two-bend orthogonal edge routing (with junction-style routing for hyperedges).
- **Force-directed** (`@filigree/alg-force`) — Fruchterman-Reingold with a deterministic golden-angle spiral start. Optional Barnes-Hut O(n log n) repulsion via a quadtree.
- **Mr.Tree** (`@filigree/alg-mrtree`) — Reingold-Tilford-style tree placement.
- **Radial** (`@filigree/alg-radial`) — concentric-tree layout.
- **Rectpacking** (`@filigree/alg-rectpacking`) — shelf-packing for edge-free rectangle collections.
- **Stress** (`@filigree/alg-stress`) — stress majorization with hop-distance targets; disconnected components handled.

### Human hint subsystem (`@filigree/hints`)

Filigree's deliberate divergence from upstream ELK. Five hint kinds:

- **Post-layout** (any algorithm) — `PinPosition`, `Focus`.
- **In-layout** (layered) — `SameLayer`, `OrderBefore`, `Group`.

Hints inherit through the compound parent chain so a host can attach them once at the root and have them apply inside whichever sub-layout contains the referenced ids.

### Infrastructure

- **Engine** (`@filigree/core`) — `DefaultLayoutEngine`, `IAlgorithmRegistry`, `IOptionResolver`, `ILayoutObserver` dispatch (algorithm-start / algorithm-completed + per-phase events for the layered pipeline).
- **Graph model** (`@filigree/graph`) — nodes / edges / ports / labels with elkjs-compatible JSON I/O, branded ids, property holders, hyperedge `routeSegments`.
- **Renderer** (`@filigree/render-svg`) — self-contained SVG output, per-element `nodeStyle` / `edgeStyle` callback hooks, dashed lines, corner radius, label backgrounds.
- **Facade** (`@filigree/api`) — single-call `layout()` with every algorithm registered.

### Quality

- 120 unit, integration, and property-based tests via `vitest`. Property tests via `fast-check` cover layered topological order / non-overlap / orthogonal routing, plus algebraic properties of `pinPosition` and `focus`.
- ESLint quality bar: per-file size cap, max-lines-per-function, max-params, max-depth, complexity, no magic numbers, no inline string unions, one class per file.
- Strict TypeScript: `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`.
- Vitest `bench` suite at the workspace root with deterministic graph generators.
- Every source file carries an EPL-2.0 header. Files derived from a specific ELK Java class preserve the original Kiel University copyright per EPL §3.1(c).

### Known limitations

- `pinPosition` does not re-route edges through the pinned node — they still trace the originally computed bend points.
- Brandes-Köpf width-matching across the 4 alignments is not implemented; the implementation does median combine without per-alignment width normalization.
- Mr.Tree subtree-overlap correction not yet implemented; adequate for trees with comparable-width subtrees.
- Rectpacking is shelf-only; ELK's three-phase width-approximation / packing / whitespace-elimination pipeline is a future iteration.
