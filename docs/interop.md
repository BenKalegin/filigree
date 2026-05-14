# Interop guarantees

What filigree promises about the input you pass in and the output you get back. Tuned for hosts migrating from `@dagrejs/dagre` or `elkjs` who need to know what to expect — and what to do for themselves.

## Pre-set port positions

The layered algorithm **respects pre-set port `(x, y)` and dimensions**. If you populate `IPort.x` / `IPort.y` / `width` / `height` (or the equivalent JSON fields) before calling `layout`, the port stays at that position in its owning node's local frame after layout, and the edge router uses the port's center as the endpoint anchor (`endpointAnchor` in `@filigree/graph/anchors.ts`).

What filigree does **not** read yet: `IPort.side` (north / east / south / west). The anchor logic anchors at the port's geometric center regardless of `side` (see the comment in `anchors.ts:8` — "Port-side-aware anchoring is a future iteration").

Practical consequence for hosts that compute their own port positions: filigree's port handling is a pure pass-through, so you can either

- give filigree your authoritative port `(x, y)` and trust the result, or
- run your own port-alignment post-pass on the laid-out graph (filigree won't fight you).

`side` matters only if you intend filigree to choose the side based on the edge direction. Today it doesn't — your `(x, y)` is the source of truth.

## Edge bend points after layered layout

After `layout(graph)`, every `IEdge.bendPoints` for layered-routed edges is the **routed orthogonal polyline**, with the following conventions:

- **Endpoints are excluded.** `bendPoints` contains only the interior bends — the source anchor and target anchor are not in the list. Renderers derive the endpoints from the source/target node geometry (matches `elkjs`).
- **Straight edges have empty `bendPoints` (`[]`).** Same-column zero-offset routes return no interior bends (`orthogonal-bends.ts:30-31`).
- **Coordinates are in the parent compound's local frame.** The default engine shifts every contained edge along with its children inside `fitContainerToChildren`, so bend points and node positions share the same frame.
- **Hyperedges** (multiple sources or multiple targets) use `IEdge.routeSegments` instead — one polyline per branch from each endpoint to the shared junction. `bendPoints` is empty for hyperedges.
- **Routing can be skipped.** Set `elk.edgeRouting: 'OFF'` (or `'POLYLINE'`) on the graph and the router phase is bypassed entirely — every edge keeps an empty `bendPoints` list and the renderer falls back to a straight source-to-target line. Use this when the host has its own router downstream.

## Coordinate system

- **Positive y is down**, positive x is right. Top-left-origin, matching SVG / DOM / `elkjs`.
- The root graph's children are laid out starting at `(padding, padding)` where padding comes from `elk.padding` (default 20). Compound nodes recursively follow the same convention in their own local frames.
- After layout, every compound `INode`'s `(x, y, width, height)` reflects the bounding box of its children plus padding (`default-layout-engine.ts::fitContainerToChildren`). Two-level and deeper nesting are covered by `packages/alg-layered/test/hierarchical-layout.test.ts`.

## Async / sync model

`@filigree/api`'s `layout(graph)` returns a `Promise<ElkGraph>`. Internally:

- Every shipped algorithm is **CPU-only and synchronous**. No I/O, no Web Workers, no timers. `LayeredAlgorithm.run` literally ends with `return Promise.resolve()` — the same microtask that called `layout` resolves to the laid-out graph.
- The `async` return is a forward-compatibility contract, not a hint that work is offloaded. If a future algorithm wants a worker, the signature won't have to change.

What this means for consumers:

- `await layout(graph)` is effectively synchronous — no need for `requestIdleCallback` for small graphs.
- For large graphs you may want a worker yourself; nothing about filigree forces one, and `DefaultLayoutEngine` is safe to call from inside a `Worker.onmessage`.
- Idempotent: calling `layout` on the same graph a second time produces the same result. Algorithms write positions and bend points; they don't read prior layout state.

## Other notes

- **JSON input format** matches `elkjs` — the same JSON should round-trip. Filigree-specific extensions (`filigreeHints` at the root, `elk.direction` / `elk.edgeRouting` in `layoutOptions`) are additive; `elkjs` ignores them.
- **Algorithm-agnostic options** live on `IJsonGraph.layoutOptions` (or any node's `layoutOptions`) under their `elk.*` id. The option resolver inherits from each compound's parent chain up to the root — set it once on the root for a uniform value, override on a specific compound when needed.
