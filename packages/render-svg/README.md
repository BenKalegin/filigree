# @filigree/render-svg

Self-contained SVG renderer for laid-out [filigree](https://github.com/BenKalegin/filigree) graphs. No external stylesheet, no DOM — produces a string you can drop into an HTML page or save to disk.

## Install

```bash
pnpm add @filigree/render-svg @filigree/graph
```

## Use

```ts
import { renderSvg } from '@filigree/render-svg';

await engine.layout(graph);
const svg = renderSvg(graph);
```

Override the default look via the second argument: `nodeFill`, `nodeStroke`, `nodeCornerRadius`, `edgeStroke`, `edgeStrokeDasharray`, `labelBackground`, plus per-element `nodeStyle(node)` / `edgeStyle(edge)` callbacks returning partial overrides.

Hyperedges (multi-source / multi-target) render as one polyline per branch meeting at a shared junction.

## License

EPL-2.0.
