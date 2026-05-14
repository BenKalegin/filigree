# Human hints

Filigree's **human hint system** lets a diagram author nudge specific layout decisions without writing algorithm code. Hints are filigree's deliberate divergence from upstream ELK.

A hint is a **soft constraint**. An algorithm that knows how to honor a given hint kind will apply it; an algorithm that doesn't simply ignores it. Hints that reference missing nodes or are inapplicable in context are silently dropped — never throw.

## Two integration paths

Hints come in two flavors, distinguished by *when* they are honored:

| Flavor          | Honored                                  | Applies to         | How to use                                                                |
| --------------- | ---------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| **Post-layout** | After `engine.layout()` returns          | Any algorithm      | Pass the hint list to `applyHints(graph, [...])` after layout finishes    |
| **In-layout**   | During the appropriate layout phase      | Layered (today)    | Attach to the graph with `attachHints(graph, [...])` *before* layout runs |

The default layered algorithm returned by `createDefaultLayeredAlgorithm()` already wraps the affected phases with hint-aware decorators, so in-layout hints work out of the box — you only need to attach them.

## Hint kinds

The set is closed and lives in `HintKind` (`packages/hints/src/hint-kind.ts`).

### `PinPosition` — post-layout

Pin a node to a specific absolute position. After the algorithm finishes, the pinned node's computed `(x, y)` is overridden with the hint's coordinates.

```typescript
import { applyHints, pinPosition } from '@benkalegin/filigree-hints';

await engine.layout(graph);
applyHints(graph, [pinPosition('start', 0, 0)]);
```

- **Applies to:** any algorithm. PinPosition is post-layout, so it is independent of which algorithm ran.
- **POC caveat:** edges already routed through a pinned node are not re-routed. Consumers that care must re-route themselves.

### `SameLayer` — in-layout (layered only)

Force two nodes onto the same layer in a layered layout.

```typescript
import { attachHints, sameLayer } from '@benkalegin/filigree-hints';

attachHints(graph, [sameLayer('a', 'b')]);
await engine.layout(graph);
```

- **Honored by:** `HintAwareLayerer`, which wraps the chosen layer assigner. If `a` and `b` land on different layers, both are pushed to `max(layer(a), layer(b))`.
- **Why push up, not down:** pushing down a layer can leave a node's predecessors above it, violating DAG order. Pushing up is always safe relative to predecessors.
- **Ignored by:** force, radial, mrtree.

### `OrderBefore` — in-layout (layered only)

Force `nodeA` to sit to the left of `nodeB` within their layer.

```typescript
import { attachHints, orderBefore } from '@benkalegin/filigree-hints';

attachHints(graph, [orderBefore('a', 'b')]);
await engine.layout(graph);
```

- **Honored by:** `HintAwareCrossingMinimizer`, which wraps the chosen crossing minimizer. After the minimizer runs, if both nodes share a layer and the order is reversed, they are swapped.
- **Silently ignored** when the two nodes end up on different layers. Pair with `SameLayer` if you need both invariants.
- **Conflict resolution:** multiple `OrderBefore` hints on the same layer are applied left-to-right; the last hint wins.
- **Ignored by:** force, radial, mrtree.

### `Group` — in-layout (layered only)

Keep a set of nodes visually clustered.

```typescript
import { attachHints, group } from '@benkalegin/filigree-hints';

attachHints(graph, [group(['task_a', 'task_c', 'task_e'])]);
await engine.layout(graph);
```

- **Honored by:** `HintAwareCrossingMinimizer`. After the minimizer runs, for each layer that holds two or more group members, the members are packed into a contiguous run starting at the leftmost member's current index. Non-member ordering is preserved.
- **Members on different layers** stay where they are — group is not promoted to a same-layer constraint. Combine with `SameLayer` if you also want a single row.
- **Interaction with `OrderBefore`:** `Group` is applied first, `OrderBefore` second; explicit pair ordering overrides clustering.
- **Ignored by:** force, radial, mrtree.

### `Focus` — post-layout

Translate the entire laid-out graph so a chosen node ends up centered at a specified position (default: origin). The relative geometry stays intact — every node position and every edge bend point gets the same translation.

```typescript
import { applyHints, focus } from '@benkalegin/filigree-hints';

await engine.layout(graph);
applyHints(graph, [focus('start')]);
// 'start' is now centered at (0, 0); all other nodes and edge bend
// points moved by the same delta.

applyHints(graph, [focus('start', 100, 100)]);
// Alternative anchor: 'start' centered at (100, 100).
```

- **Applies to:** any algorithm. Post-layout, like `PinPosition`.
- **Useful for** "center the diagram around this node" rendering modes where the viewer pans/zooms around a focal point.
- **No-op** when the focus node is already at the requested center, or when the named id doesn't exist.

## Combining hints

`SameLayer` + `OrderBefore` compose naturally: put two nodes on the same layer, then dictate their left-right order.

```typescript
attachHints(graph, [
  sameLayer('leaf_a', 'leaf_b'),
  orderBefore('leaf_b', 'leaf_a'),
]);
await engine.layout(graph);
// leaf_a and leaf_b are on the same layer, with leaf_b to the left of leaf_a.
```

This case is covered by `packages/alg-layered/test/hint-aware.test.ts`.

## Attaching hints from JSON

Instead of building an `ElkGraph` and calling `attachHints`, you can declare hints inline on the JSON object you pass to `layout`:

```typescript
import { layout } from '@benkalegin/filigree-api';

await layout({
  id: 'root',
  children: [...],
  edges: [...],
  filigreeHints: [
    { kind: 'OrderBefore',  before: 'n1', after: 'n2' },
    { kind: 'SameLayer',    nodes: ['n3', 'n4'] },
    { kind: 'Group',        nodes: ['task_a', 'task_c', 'task_e'] },
    { kind: 'PinPosition',  node: 'start', x: 0, y: 0 },
    { kind: 'Focus',        node: 'main', centerX: 0, centerY: 0 },
  ],
});
```

Field names match the kind:

| `kind`         | Required fields            | Optional fields           |
| -------------- | -------------------------- | ------------------------- |
| `OrderBefore`  | `before`, `after`          | —                         |
| `SameLayer`    | `nodes` (exactly two ids)  | —                         |
| `Group`        | `nodes` (≥ 1 id)           | —                         |
| `PinPosition`  | `node`, `x`, `y`           | —                         |
| `Focus`        | `node`                     | `centerX`, `centerY` (default 0) |

Malformed entries (missing fields, wrong types, unknown `kind`) are dropped silently — same soft-constraint semantic as the code-level applicators. The bare `fromJson` from `@benkalegin/filigree-graph` ignores `filigreeHints`; the field is interpreted by `@benkalegin/filigree-api`'s `layout`. If you build an `ElkGraph` directly, use `attachHints` instead.

## Hints under `elk.direction`

The in-layout hints describe positions **in the layered algorithm's internal frame**, not the user-visible frame. The internal frame is always top-to-bottom; the algorithm rotates the result for `RIGHT` / `LEFT` / `UP` directions (see `docs/interop.md`).

What that means per hint kind:

- **`SameLayer`** — independent of direction. "Same layer" means "same step in the flow direction": same row for TB / BT, same column for LR / RL.
- **`Group`** — independent of direction. The cluster is contiguous within whichever axis is perpendicular to the flow.
- **`OrderBefore(a, b)`** — always means *"a comes earlier than b in the perpendicular-to-flow direction"*. Concretely:
  - `direction: DOWN` — `a` is to the **left** of `b` within the layer.
  - `direction: RIGHT` — `a` is **above** `b` within the layer.
  - `direction: UP` — `a` is to the **left** of `b` within the layer (UP flips y, not x).
  - `direction: LEFT` — `a` is **above** `b` within the layer (LEFT mirrors x; relative within-layer order along the perpendicular axis is preserved).

The semantic is "source-order in the layer's perpendicular axis", which is stable across directions — write the hint once, and the visual outcome rotates with the diagram.

`PinPosition` and `Focus` are post-layout and operate in the user-visible frame; their coordinates mean whatever they say after rotation.

## How hints are stored

`attachHints` writes the hint list onto a graph property keyed `filigree.hints`. `getHints(graph)` returns the list (or an empty list if none are attached). Algorithms that recognize a hint kind read this property during their phase and filter by `kind`.

```typescript
import { attachHints, getHints } from '@benkalegin/filigree-hints';

attachHints(graph, [pinPosition('a', 10, 20)]);
getHints(graph); // readonly IHint[]
```

The property is read once per layout pass; mutating the array after `engine.layout()` returns has no effect on that pass.

## Failure modes

All silent by design — hints are soft:

- **Unknown node id** — hint is dropped. Useful when a hint list is generated by tooling that may target a sub-graph not present in this pass.
- **Empty hint list** — `applyHints` and the decorators short-circuit. Zero overhead.
- **Inapplicable algorithm** (e.g. `SameLayer` on a force layout) — the decorator simply isn't in that algorithm's pipeline; the hint is ignored.
- **Both ids identical** — no-op.

## Adding a new hint kind

Open/closed: add a kind without modifying any existing applicator.

1. Add the discriminator to `HintKind` (`packages/hints/src/hint-kind.ts`).
2. Add a `*-hint.ts` file in `packages/hints/src/` declaring the `IHint` subtype and its factory (mirror `pin-position-hint.ts`).
3. Re-export both from `packages/hints/src/index.ts`.
4. Wire an applicator:
   - **Post-layout:** add a branch in `apply-hints.ts`.
   - **In-layout:** add a decorator next to `hint-aware-layerer.ts` / `hint-aware-crossing-minimizer.ts`, wrap the relevant phase in `composition.ts`.
5. Cover the happy path, "ignored when inapplicable," and "unknown id" in tests.

## See also

- `packages/hints/` — hint definitions and the post-layout dispatcher.
- `packages/alg-layered/src/phases/layer-assignment/hint-aware-layerer.ts` — `SameLayer` decorator.
- `packages/alg-layered/src/phases/crossing-minimization/hint-aware-crossing-minimizer.ts` — `OrderBefore` + `Group` decorator.
- `packages/alg-layered/src/composition.ts` — where the decorators wrap the default pipeline.
