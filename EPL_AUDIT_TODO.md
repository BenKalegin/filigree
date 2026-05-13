# EPL-2.0 attribution audit — to do

Filigree is licensed under the Eclipse Public License 2.0 (see [`LICENSE`](./LICENSE) + [`NOTICE`](./NOTICE)). Until this audit lands, license coverage is project-level only. The EPL strongly recommends per-file traceability — original ELK Java copyright preserved on every file that's a derivation, our own copyright on every file that isn't. The template lives at [`COPYRIGHT_HEADER_TEMPLATE.ts`](./COPYRIGHT_HEADER_TEMPLATE.ts).

## What needs doing

For every `.ts` file under `packages/*/src/` and `packages/*/test/`:

1. **Classify**: is this file a translation of a specific ELK Java source ("derived"), or independently written ("original")?
2. **For derived files** — add the **full header** from `COPYRIGHT_HEADER_TEMPLATE.ts` with:
   - `[ORIGINAL_YEAR_OR_RANGE]` — copy verbatim from the ELK source file header.
   - `[ORIGINAL_CONTRIBUTORS]` — usually "Kiel University and others".
   - `[PORT_YEAR]` — year the TS file was created (current year for the initial pass).
   - `[ORIGINAL_JAVA_PATH]` — relative path of the ELK Java source inside the [`eclipse-elk/elk`](https://github.com/eclipse-elk/elk) repo, e.g. `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p1cycles/GreedyCycleBreaker.java`.
3. **For original files** — add the **short header** (just our copyright + SPDX line).

Don't remove or alter the original copyright line on any derived file — preserving it is required by EPL-2.0 §3.1(c).

## Initial classification (draft, requires source-by-source review)

### Suspected _derived_ (likely direct ports of an ELK Java class)

Each of these should be checked against the corresponding ELK source to either confirm the derivation or downgrade to "inspired by, not derived":

- `packages/alg-layered/src/phases/cycle-breaking/greedy-cycle-breaker.ts`
  → `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p1cycles/GreedyCycleBreaker.java`
- `packages/alg-layered/src/phases/layer-assignment/longest-path-layerer.ts`
  → `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p2layers/LongestPathLayerer.java`
- `packages/alg-layered/src/phases/crossing-minimization/barycenter-crossing-minimizer.ts`
  → `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p3order/...` (likely `BarycenterHeuristic.java` or similar)
- `packages/alg-layered/src/phases/node-placement/brandes-kopf-node-placer.ts`
  → `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p4nodes/bk/BKNodePlacer.java`
- `packages/alg-layered/src/phases/node-placement/linear-node-placer.ts`
  → `plugins/org.eclipse.elk.alg.layered/src/org/eclipse/elk/alg/layered/p4nodes/LinearSegmentsNodePlacer.java`
- `packages/alg-layered/src/phases/node-placement/balanced-node-placer.ts`
  → review — may not have a direct ELK counterpart (this one was written as an intermediate step between Linear and Brandes-Köpf)
- `packages/alg-layered/src/phases/edge-routing/orthogonal-edge-router.ts`
  → review — ELK has multiple orthogonal routers; pick the closest one
- `packages/alg-force/src/force-directed-algorithm.ts`
  → `plugins/org.eclipse.elk.alg.force/src/org/eclipse/elk/alg/force/...` (Fruchterman-Reingold implementation)
- `packages/alg-mrtree/src/mrtree-algorithm.ts`
  → `plugins/org.eclipse.elk.alg.mrtree/src/org/eclipse/elk/alg/mrtree/...` (likely a heavily-simplified port; classify accordingly)

### Suspected _original_ (independent implementation, no specific ELK source)

These were written from scratch as part of the TypeScript redesign and don't carry direct ELK Java derivation. They should use the **short header**:

- All of `packages/graph/src/*` — TypeScript-native data model, branded ids, JSON I/O.
- All of `packages/core/src/*` — default engine, registry, option resolver, well-known options. ELK has equivalents but the TS shape is independent.
- All of `packages/render-svg/src/*` — no ELK equivalent.
- All of `packages/alg-layered/src/model/*` — intermediate `LNode` / `LayeredContext` / context builder are our shape; ELK has `LGraph`/`LNode` but the TS interfaces and lifecycle are independent.
- `packages/alg-layered/src/layered-algorithm.ts` — pipeline orchestrator, our composition.
- `packages/alg-layered/src/layered-result-applier.ts` — our shape.
- `packages/alg-layered/src/composition.ts` — wiring, ours.
- `packages/alg-layered/src/null-phase.ts` — small factory, ours.
- `packages/alg-layered/src/layered-options.ts` — option declarations; ids match ELK's, the IOption struct is ours.
- `packages/alg-force/src/composition.ts`, `force-options.ts` — same pattern as layered.
- `packages/alg-mrtree/src/composition.ts`, `mrtree-options.ts` — same.
- `packages/api/src/*` — facade, no ELK counterpart.
- `packages/util-*/src/*` — stub interfaces, ours.
- All test files — test our TS implementations.

## Process

1. Walk every `.ts` file under `packages/*/`.
2. Read it. If it's a port of a specific Java class, fill in the full header with the matching ELK Java path.
3. Otherwise, prepend the short header.
4. Land in small commits per package so reviewers can audit each batch.
5. After all files are headered, drop this file.

## Notes

- For files marked "review" above, fetching the ELK source and side-by-side comparing is the only honest way to decide. If the TS file's structure, variable names, and step order match the Java, it's a derivation. If we re-implemented from a paper/textbook description and the code shape diverges, it's original.
- When in doubt, prefer the full header. Over-attribution is harmless; under-attribution is an EPL §3.1(c) violation.
- The hint subsystem (when implemented) is original — no ELK counterpart. Use the short header.
