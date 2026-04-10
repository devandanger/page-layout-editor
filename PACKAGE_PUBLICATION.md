# Package Publication Plan

The editor has been extracted into an Angular workspace library:

```text
projects/page-layout-editor/
```

The demo host app under `src/app` now consumes that library through the workspace package import:

```ts
import { PageLayoutEditor, hydrateDocument, serializeDocument } from 'page-layout-editor';
```

## Current Library Shape

- Library root: `projects/page-layout-editor`
- Public package entrypoint: `projects/page-layout-editor/src/public-api.ts`
- Public library surface: `projects/page-layout-editor/src/lib/public-api.ts`
- Internal implementation: `projects/page-layout-editor/src/lib/internal`

## Current Consumer Shape

- Demo routes and shell: `src/app/pages`
- Host persistence shell: `src/app/services/content.service.ts`
- Browser smoke tests: `e2e/`

The host app should not import from `projects/page-layout-editor/src/lib/internal`.

## What The Package Owns

- document model types
- hydration, serialization, and validation
- block registry contracts
- editor config/theme/action contracts
- layout rules and collision behavior
- default print preview behavior
- editor UI and interaction behavior

## What The Host App Owns

- routing
- docs/demo page
- persistence and autosave
- backend integration
- auth and permissions
- product-specific validation
- domain-specific block registries

## Current Build And Verification

App and library checks:

```bash
npm run test:boundary
npm test
npm run build
npx ng build page-layout-editor
npm run test:e2e
```

## Remaining Publication Work

1. Decide whether to publish as:
   - a private npm package
   - a workspace package only
   - a git dependency
2. Decide whether the package should keep a single entrypoint or add sub-entrypoints later.
3. Consider whether custom renderer components are needed beyond the current `renderKind` support.
4. Add release/versioning workflow if the package will be published outside the repo.

## Known Limitations

- Styling is component-scoped and may need more theme tokens for broader host customization.
- `renderKind` supports reuse of built-in renderers, but not arbitrary custom Angular renderer components yet.
- The demo host app currently uses a source-path alias for local workspace consumption. Published consumers will resolve the package from npm instead.

## npm Consumption

The library package is configured as:

```text
page-layout-editor
```

Then install it with:

```bash
npm install page-layout-editor
```
