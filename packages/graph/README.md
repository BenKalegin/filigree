# @filigree/graph

TypeScript graph model for [filigree](https://github.com/BenKalegin/filigree): nodes, edges, ports, labels, branded ids, property holders, and elkjs-compatible JSON I/O.

The shape every other filigree package consumes. Algorithms mutate this graph in place; renderers read it.

## Install

```bash
pnpm add @filigree/graph
```

## Use

```ts
import { fromJson, toJson } from '@filigree/graph';

const graph = fromJson({
  id: 'root',
  children: [
    { id: 'a', width: 40, height: 30 },
    { id: 'b', width: 40, height: 30 },
  ],
  edges: [{ id: 'e', sources: ['a'], targets: ['b'] }],
});
// Run a layout, then…
const json = toJson(graph);
```

The JSON shape follows the [ELK JSON format](https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html).

## License

EPL-2.0.
