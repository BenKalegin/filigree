# Code Conventions

The codebase will grow large. These rules keep it navigable without making it boilerplate-heavy. Every rule has a _why_ — break it deliberately, never accidentally.

## SOLID

| Letter | Rule                  | What it looks like here                                                                                                                        |
| ------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**  | Single Responsibility | One class = one verb. `LayerAssigner` only assigns layers; it does not also route edges. Two responsibilities ⇒ two classes.                   |
| **O**  | Open / Closed         | Algorithms compose by interface (`ILayerAssigner`, `ICrossingMinimizer`, …). Adding a new strategy must not edit the pipeline.                 |
| **L**  | Liskov                | Every strategy must satisfy its interface's contract — including documented invariants (e.g. "does not mutate the input graph").               |
| **I**  | Interface Segregation | No god-interfaces. An observer that only wants `onPhaseStart` does not need to implement `onNodePlaced`.                                       |
| **D**  | Dependency Inversion  | Concrete classes depend on interfaces, never on other concrete classes. Wiring is done at the composition root (engine constructor / factory). |

## Size limits (enforced)

- **Function**: ≤ 40 lines (blanks/comments don't count). If it's longer, it does too much — extract.
- **File**: ≤ 250 lines.
- **Class per file**: 1.
- **Function parameters**: ≤ 4. More? Take a typed parameter object.
- **Cyclomatic complexity**: ≤ 8.
- **Nesting depth**: ≤ 3.

ESLint enforces these. Disabling a limit is allowed only with a comment explaining _why this code is the exception_. Bare `eslint-disable` is reviewed out.

## No string constants — enums or `const` objects

Bare string literals used as identifiers, modes, kinds, or directions are banned in business logic.

❌ Wrong:

```ts
function position(node: Node, side: 'left' | 'right' | 'top' | 'bottom') { ... }
node.kind = 'compound';
```

✅ Right:

```ts
export enum NodeSide { Left, Right, Top, Bottom }
function position(node: Node, side: NodeSide) { ... }

export enum NodeKind { Atomic, Compound }
node.kind = NodeKind.Compound;
```

When you need stable wire values (JSON, IDs), use a string-valued enum or a `const` object with `as const`:

```ts
export enum SerializedNodeKind {
  Atomic = 'atomic',
  Compound = 'compound',
}
```

Strings are only allowed:

1. At I/O boundaries (serializer keys, error messages, log lines).
2. As enum _values_ (declared in one place).
3. In tests (`describe` / `it` labels).

## No magic numbers

Same rule, numeric edition. Allowed: `-1, 0, 1, 2`. Anything else needs a `const` with a name that explains it.

❌ `for (let i = 0; i < 100; i++)`  
✅ `const MAX_ITERATIONS = 100;` (or take it from options).

## Exports

- **Named exports only.** No `export default`. Default exports refactor badly and are invisible in IDE rename.
- One concept per file. If a file exports more than one class, split it.

## Errors

- Throw typed error classes (`InvalidGraphError`, `OptionConflictError`). Never throw bare strings or generic `Error`.
- Error classes go in `errors.ts` per package.
- At public API boundaries: validate inputs and throw `InvalidGraphError`. Internal code trusts its callers.

## Imports

- No circular imports. ESLint enforces.
- No deep imports across packages — only the package's `index.ts` is public.
- Use `import type { … }` for type-only imports (auto-fixed).

## Testing

- Vitest for unit + snapshot tests.
- `fast-check` for property tests on geometry, solvers, and any pure algorithmic function (idempotence, determinism, invariants over random graphs).
- Test file lives next to the source (`foo.ts` → `foo.test.ts`) for small units, or under `test/` for cross-cutting integration tests.
- The size limits do not apply to test code.

## Comments

Comment _why_, not _what_. Code says what. A good comment captures a hidden constraint, a non-obvious invariant, or a deliberate workaround. If removing the comment wouldn't confuse a future reader, don't write it.

No TODO/FIXME comments without an issue number.

## Composition root

Wiring (which strategy goes into which slot) lives in one place per package, conventionally `composition.ts` or the package's `index.ts`. Algorithm code never news-up a concrete dependency it could inject.

## Sketch: how a layered-layout phase looks

```ts
// packages/alg-layered/src/phases/layer-assignment/longest-path-layerer.ts
import type { ILayerAssigner } from '../i-layer-assigner.js';
import type { LayoutContext } from '../../layout-context.js';

export class LongestPathLayerer implements ILayerAssigner {
  public assign(ctx: LayoutContext): void {
    // ~30 lines max. Single phase. No state outside ctx.
  }
}
```

One responsibility. Depends only on interfaces. Stateless. Composable.
