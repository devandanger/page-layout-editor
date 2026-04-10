# Page Layout Prototype

Angular 21 app for laying out content blocks (image, text, questions) into printable pages using CDK Drag & Drop.

## Key Commands

- `ng serve` — dev server on http://localhost:4200
- `ng build` — production build

## Architecture

- **Schema-driven blocks** — each `ContentBlock` carries a `BlockSchema` declaring its editable properties (`PropDef[]`). The property panel renders controls dynamically from the schema.
- **Block types** defined in `src/app/models/block-schemas.ts` with `SCHEMA_REGISTRY` for lookup.
- **Home page** (`/`) — JSON editor, page size presets, block preview cards.
- **Editor** (`/editor`) — CDK Drag & Drop with sortable blocks, property panel on right, File menu with print preview.

## Adding a New Block Type

1. Define a `BlockSchema` in `src/app/models/block-schemas.ts`
2. Add it to `SCHEMA_REGISTRY`
3. Create a default factory function
4. Add a rendering case in the editor templates (or the `@default` fallback renders JSON)

## Prototypes Tag

The `prototypes` tag (`15bbb72`) contains all three editor implementations (Gridster2, CDK, GrapesJS) before we narrowed to CDK-only. To revisit:

```
git checkout prototypes
```
