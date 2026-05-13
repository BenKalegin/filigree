# Layout examples

Single documented repo of layout approaches. Each section names an algorithm or strategy, explains what it does, and shows the rendered output as an inline image. The SVG files live next to this doc under `examples/` — they are referenced, not duplicated.

Regenerate with `pnpm --filter @filigree/alg-layered generate-docs`.

<!-- Generated file — do not edit by hand. -->

## Index

- [Layered (default)](#layered-default)
- [Layered with BalancedNodePlacer](#layered-balanced)
- [Layered with LinearNodePlacer](#layered-linear)
- [Layered on a cyclic graph](#layered-cyclic)
- [Layered with a compound node](#layered-compound)
- [Parallel edges (bidirectional pair)](#layered-bidirectional)
- [Compound with custom padding (elk.padding = 4)](#layered-compound-tight)
- [Flowchart with label backgrounds](#layered-themed)
- [Mr.Tree (tree layout)](#mrtree-project)
- [Force-directed](#force-organic)

## Layered (default)

Classic top-to-bottom flowchart. Default composition: greedy cycle breaker, longest-path layer assignment, barycenter crossing minimization, Brandes-Köpf node placement, two-bend orthogonal edge routing.

![Layered (default)](examples/layered-default.svg)

## Layered with BalancedNodePlacer

Same flowchart, simpler placer: linear initial placement then a single-pass median balance.

![Layered with BalancedNodePlacer](examples/layered-balanced.svg)

## Layered with LinearNodePlacer

Simplest placer — every node at its `indexInLayer * spacing`. Reveals what a pre-balancing layout looks like.

![Layered with LinearNodePlacer](examples/layered-linear.svg)

## Layered on a cyclic graph

Demonstrates the greedy cycle breaker. The back edge (fix → check) is reversed for layering so longest-path treats the graph as a DAG.

![Layered on a cyclic graph](examples/layered-cyclic.svg)

## Layered with a compound node

Hierarchical layout. The engine recurses bottom-up: the sub-flow is laid out first, the compound is sized from its children, then the top level lays out preamble → sub-flow → finale.

![Layered with a compound node](examples/layered-compound.svg)

## Parallel edges (bidirectional pair)

Two edges between the same node pair. The router groups parallel edges, leaves one along the natural column, and detours the other through a side offset (LayeredOptions.parallelEdgeOffset). Without the offset both lines would trace the same vertical column.

![Parallel edges (bidirectional pair)](examples/layered-bidirectional.svg)

## Compound with custom padding (elk.padding = 4)

Same compound topology as above but the root sets `elk.padding: 4`. Inheritance walks the parent chain in DefaultOptionResolver, so the sub-flow compound picks up the tighter padding without an explicit override.

![Compound with custom padding (elk.padding = 4)](examples/layered-compound-tight.svg)

## Flowchart with label backgrounds

Same flowchart, rendered with `labelBackground: "#fef3c7"`. The renderer emits a backing rect behind every label so wider text remains readable over busy edges or narrow nodes.

![Flowchart with label backgrounds](examples/layered-themed.svg)

## Mr.Tree (tree layout)

Reingold-Tilford-style tree placement. Leaves are placed left-to-right, internal nodes are centred above their direct children, levels stack vertically. Reads edges as parent → child; nodes with no incoming edge are treated as roots.

![Mr.Tree (tree layout)](examples/mrtree-project.svg)

## Force-directed

Fruchterman-Reingold. Deterministic spiral start, 100 iterations with cooling. Connected nodes converge to roughly equal spring lengths; the graph forms two triangles linked by one edge.

![Force-directed](examples/force-organic.svg)
