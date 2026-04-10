# Page Layout Editor Boundary

This folder is the internal library-shaped boundary for the reusable editor.

Host-app code should import editor components, types, and helpers from this folder instead of reaching into the implementation folders directly. The implementation lives under `internal/`, while the public surface remains in the API entrypoints so it can later move into an Angular library or internal npm package.

- `document-api.ts` exposes document types, registry contracts, config/theme/action types, and document hydration/serialization/validation helpers.
- `editor-api.ts` exposes the standalone editor UI component.
- `public-api.ts` re-exports both surfaces for a future package entrypoint.

`internal/` contains implementation details. `EditorMenu`, `PropertyPanel`, ID/layout helpers, and low-level layout utilities are intentionally not part of the public surface right now.

Within this app, prefer the narrowest sub-entrypoint (`document-api.ts` for the home/demo page, `editor-api.ts` for the editor route) to preserve lazy-loading boundaries.

The host app should own routing, persistence, auth, and product-specific behavior. The editor boundary should own the page document model, block registry contract, layout rules, editor UI, and interaction behavior.

## Custom Block Rendering

The registry can map custom block types onto built-in renderers with `renderKind`.
For example, a host app can define its own worksheet-specific `questions` schema and map it to the `list-grid` renderer without that block type being part of the default library registry.

Supported `renderKind` values:

- `image`
- `text`
- `list-grid`
- `json`

Example:

```ts
const worksheetBlockRegistry: BlockRegistry = {
  heroImage: {
    type: 'heroImage',
    label: 'Hero Image',
    schema: HERO_IMAGE_SCHEMA,
    renderKind: 'image',
    createDefaultContent: () => ({
      src: '',
      alt: '',
      objectFit: 'cover',
      borderRadius: 8,
      backgroundColor: '#ffffff',
    }),
    createDefaultLayout: () => ({ w: 12, h: 6 }),
  },
};
```

If `renderKind` is omitted, the editor falls back to the block type name for built-in block types, then to the JSON renderer for unknown render kinds.

Phase 1 renderer extensibility is now represented in the public types only:

- `BlockRendererContext`
- `BlockRendererDefinition`
- `BlockRendererRegistry`

The editor now accepts a runtime `renderers` input keyed by `renderKind`.
Each renderer definition may provide:

- `component`: the host Angular component used for on-page rendering
- `printAdapter`: optional callback that returns printable HTML and optional CSS for print preview/export

If no custom renderer is registered for a block's `renderKind`, the editor falls back to the built-in renderers.
