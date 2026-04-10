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

- `BlockRendererContext`
- `BlockRendererDefinition`
- `BlockRendererRegistry`

The editor accepts a runtime `renderers` input keyed by `renderKind`.
Each renderer definition may provide:

- `component`: the host Angular component used for on-page rendering
- `printAdapter`: optional callback that returns printable HTML and optional CSS for print preview/export

If no custom renderer is registered for a block's `renderKind`, the editor falls back to the built-in renderers.

Example:

```ts
const worksheetBlockRegistry: BlockRegistry = {
  questions: {
    type: 'questions',
    label: 'Questions',
    schema: QUESTIONS_SCHEMA,
    renderKind: 'list-grid',
    createDefaultContent: () => ({ columns: 2, showAnswers: true, questions: [] }),
    createDefaultLayout: () => ({ w: 12, h: 8 }),
  },
  callout: {
    type: 'callout',
    label: 'Callout',
    schema: CALLOUT_SCHEMA,
    renderKind: 'callout-card',
    createDefaultContent: () => ({
      eyebrow: 'Teacher Note',
      title: 'Try A Different Strategy',
      body: 'Use a number line before solving the next three prompts.',
      accentColor: '#c62828',
      backgroundColor: '#fff8f2',
    }),
    createDefaultLayout: () => ({ w: 12, h: 4 }),
  },
};

const worksheetRenderers: BlockRendererRegistry = {
  'callout-card': {
    component: WorksheetCalloutRendererComponent,
    printAdapter: ({ block }) => ({
      html: `<section class="worksheet-callout-print">${String(block.data['title'] ?? '')}</section>`,
      css: '.worksheet-callout-print { padding: 16px; }',
    }),
  },
  'list-grid': {
    component: WorksheetQuestionsRendererComponent,
  },
};
```

The design boundary is:

- `BlockSchema`: editable content fields shown in the property panel
- `BlockRegistry`: block identity, defaults, layout defaults, and `renderKind`
- `BlockRendererRegistry`: host-provided runtime and print rendering keyed by `renderKind`
