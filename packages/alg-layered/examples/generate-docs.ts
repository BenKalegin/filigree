/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Generates `docs/layout-examples.md` and the SVG files under `docs/examples/`
 * that it references. Run via `pnpm --filter @benkalegin/filigree-alg-layered generate-docs`.
 *
 * Each example pairs a graph fixture (from `example-fixtures.ts`) with an
 * engine wiring that registers a specific algorithm or strategy. The script
 * lays out the graph, renders the result, and emits both the SVG and a
 * matching markdown section.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { type ElkGraph, fromJson } from '@benkalegin/filigree-graph';
import { applyHints, attachHints, type IHint } from '@benkalegin/filigree-hints';
import { renderSvg } from '@benkalegin/filigree-render-svg';

import { EXAMPLES, type IExample } from './example-list.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(SCRIPT_DIR, '../../../docs');

const renderExample = async (example: IExample): Promise<void> => {
  const graph = fromJson(example.graph);
  if (example.preLayoutHints !== undefined) {
    attachHints(graph, example.preLayoutHints);
  }
  await example.buildEngine().layout(graph);
  applyExampleHints(graph, example.hints);
  const svg = renderSvg(graph, example.renderOptions ?? {});
  writeFileSync(path.join(DOCS_DIR, 'examples', `${example.slug}.svg`), svg, 'utf8');
};

const applyExampleHints = (graph: ElkGraph, hints: readonly IHint[] | undefined): void => {
  if (hints === undefined) {
    return;
  }
  applyHints(graph, hints);
};

/**
 * Converts a heading title to a GitHub-compatible anchor slug.
 * GitHub's algorithm: lowercase, replace spaces with hyphens, remove most punctuation.
 */
const toAnchorSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const generateMarkdown = (examples: readonly IExample[]): string => {
  const intro = [
    '# Layout examples',
    '',
    'Single documented repo of layout approaches. Each section names an algorithm or strategy, explains what it does, and shows the rendered output as an inline image. The SVG files live next to this doc under `examples/` — they are referenced, not duplicated.',
    '',
    'Regenerate with `pnpm --filter @benkalegin/filigree-alg-layered generate-docs`.',
    '',
    '<!-- Generated file — do not edit by hand. -->',
    '',
    '## Index',
    '',
    ...examples.map((e) => `- [${e.title}](#${toAnchorSlug(e.title)})`),
    '',
  ];
  const sections = examples.map(
    (e) => `## ${e.title}\n\n${e.description}\n\n![${e.title}](examples/${e.slug}.svg)\n`,
  );
  return [...intro, ...sections].join('\n');
};

const main = async (): Promise<void> => {
  for (const example of EXAMPLES) {
    await renderExample(example);
  }
  const md = generateMarkdown(EXAMPLES);
  writeFileSync(path.join(DOCS_DIR, 'layout-examples.md'), md, 'utf8');
  console.log(
    `Wrote ${path.join(DOCS_DIR, 'layout-examples.md')} + ${String(EXAMPLES.length)} SVGs under examples/.`,
  );
};

await main();
