# page-layout-editor

Reusable Angular page layout editor with block-based content, grid layout controls, document JSON serialization, and a library-shaped API for host app integration.

This repository currently includes both:

- an example/demo Angular host app
- the reusable editor boundary under `src/app/page-layout-editor`

The reusable boundary exposes the editor through `document-api.ts`, `editor-api.ts`, and `public-api.ts`. Implementation details live under `src/app/page-layout-editor/internal`.

## Development Server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Document Model

The editor uses a persisted JSON document with separate `blocks`, `layout`, and `page` sections. See [BLOCK_SCHEME_LAYOUT_BLOCK_DESIGN.md](./BLOCK_SCHEME_LAYOUT_BLOCK_DESIGN.md) for the high-level format, runtime semantics, and the stepwise enhancement plan for block schemas and layout blocks.

## Library Boundary

Host-app code should consume the editor from:

```ts
import { PageLayoutEditor } from './page-layout-editor/editor-api';
import { hydrateDocument, serializeDocument } from './page-layout-editor/document-api';
```

See [src/app/page-layout-editor/README.md](./src/app/page-layout-editor/README.md) for the internal library-shaped API boundary, public exports, and custom block rendering guidance.

## Building

To build the project, run:

```bash
npm run build
```

## Running Unit Tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, run:

```bash
npm test
```

## Boundary Check

To verify host code does not import editor internals directly, run:

```bash
npm run test:boundary
```

## Browser Smoke Tests

To run the Playwright smoke suite, run:

```bash
npm run test:e2e
```
