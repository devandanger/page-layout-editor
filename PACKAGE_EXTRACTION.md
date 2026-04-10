# Package Extraction Plan

This project is currently a demo Angular app plus an internal library-shaped editor boundary. The eventual goal is to make `page-layout-editor` consumable by another Angular application, likely as an internal npm package.

## Current Shape

- Demo host app: `src/app/pages`
- Host persistence shell: `src/app/services/content.service.ts`
- Reusable editor boundary: `src/app/page-layout-editor`
- Editor implementation details: `src/app/page-layout-editor/internal`
- Public API entrypoints:
  - `src/app/page-layout-editor/document-api.ts`
  - `src/app/page-layout-editor/editor-api.ts`
  - `src/app/page-layout-editor/public-api.ts`

Host-facing code should not import from `src/app/page-layout-editor/internal`. The boundary check enforces this for app `pages` and `services`.

## Target Package Shape

The eventual Angular library shape should look like:

```text
projects/page-layout-editor/
  src/
    lib/
      internal/
      document-api.ts
      editor-api.ts
    public-api.ts
```

The package import should eventually become:

```ts
import {
  PageLayoutEditor,
  hydrateDocument,
  serializeDocument,
  type BlockRegistry,
  type PageDocument,
  type PageLayoutEditorConfig,
} from '@your-scope/page-layout-editor';
```

## What Moves Into The Package

- `src/app/page-layout-editor/document-api.ts`
- `src/app/page-layout-editor/editor-api.ts`
- `src/app/page-layout-editor/public-api.ts`
- `src/app/page-layout-editor/internal/**`

The package should own:

- document model types
- document hydration, serialization, validation
- block registry contracts
- editor config/theme/action contracts
- layout utilities and collision rules
- editor UI and interaction behavior
- default print preview behavior

## What Stays In The Host App

- routing
- demo/docs page
- `ContentService` or any host persistence adapter
- backend loading/saving/autosave
- auth and permissions
- product-specific validation
- domain-specific block registries

## Extraction Steps

1. Create an Angular library workspace target.
2. Move `src/app/page-layout-editor` into the library source tree.
3. Preserve the current `public-api.ts` exports as the package entrypoint.
4. Update the demo app to import from the library target instead of relative app paths.
5. Keep the demo app as the first real consumer.
6. Run boundary, unit, build, and browser smoke tests.
7. Decide whether to publish as a private npm package, workspace package, or git dependency.

## Known Blockers

- Styling is component-scoped today. Package consumption may need more theme tokens if a host app wants deeper visual control.
- `renderKind` supports reuse of built-in renderers, but not arbitrary custom Angular renderer components yet.
- The package currently assumes Angular CDK drag/drop is available as a dependency. In a package, Angular and CDK should be peer dependencies.

## Verification Checklist

Before extracting:

```bash
npm run test:boundary
npm test
npm run build
npm run test:e2e
```

After extracting, the same behavior should still pass from the demo host app.
