# page-layout-editor

Reusable Angular page layout editor with block-based content, grid layout controls, document JSON serialization, and a library-shaped API for host app integration.

## Install

```bash
npm install page-layout-editor
```

Peer dependencies:

- `@angular/cdk`
- `@angular/common`
- `@angular/core`
- `@angular/forms`

## Basic Usage

Import the public API from the package root:

```ts
import {
  PageLayoutEditor,
  createEmptyDocument,
  hydrateDocument,
  serializeDocument,
  type BlockRegistry,
  type EditorTheme
} from 'page-layout-editor';
```

The editor is designed to be hosted by an Angular application that provides:

- a document JSON payload
- a block registry for rendering block content
- optional theme overrides

## Document Model

The editor persists a JSON document with separate `blocks`, `layout`, and `page` sections. The JSON document is the durable format. At runtime, the editor hydrates that structure into layout-aware editor state.

See the repository documentation for the higher-level document and layout semantics:

- `BLOCK_SCHEME_LAYOUT_BLOCK_DESIGN.md`
- `projects/page-layout-editor/src/lib/README.md`

## Development

Build the library:

```bash
npx ng build page-layout-editor
```

The published package is generated into `dist/page-layout-editor`.
