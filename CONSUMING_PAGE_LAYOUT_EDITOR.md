# Consuming `page-layout-editor`

This guide shows the intended host-app integration path for another Angular application.

## 1. Install

```bash
npm install page-layout-editor
```

The package currently targets Angular 21 peer dependencies:

- `@angular/cdk`
- `@angular/common`
- `@angular/core`
- `@angular/forms`

## 2. Import The Public API

```ts
import {
  PageLayoutEditor,
  DEFAULT_BLOCK_REGISTRY,
  createEmptyDocument,
  hydrateDocument,
  serializeDocument,
  type BlockRegistry,
  type BlockRendererRegistry,
  type BlockSchema,
  type EditorTheme,
  type PageDocument,
  type SerializedPageDocument,
} from 'page-layout-editor';
```

## 3. Define Host-Owned Block Schemas

The library gives you the editor shell and built-in block types. Your app can add product-specific block types by extending the registry.

```ts
export const QUESTIONS_SCHEMA: BlockSchema = {
  typeLabel: 'Questions',
  icon: '?',
  properties: [
    { key: 'columns', label: 'Grid Columns', type: 'number', min: 1, max: 6 },
    { key: 'showAnswers', label: 'Show Answers', type: 'boolean' },
    {
      key: 'questions',
      label: 'Questions',
      type: 'array',
      itemSchema: [
        { key: 'question', label: 'Question', type: 'text' },
        { key: 'answer', label: 'Answer', type: 'text' },
      ],
      itemDefault: { question: '', answer: '' },
    },
  ],
};

export const CALLOUT_SCHEMA: BlockSchema = {
  typeLabel: 'Callout',
  icon: '✦',
  properties: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'accentColor', label: 'Accent Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
  ],
};
```

## 4. Compose A Block Registry

```ts
export const WORKSHEET_BLOCK_REGISTRY: BlockRegistry = {
  ...DEFAULT_BLOCK_REGISTRY,
  questions: {
    type: 'questions',
    label: 'Questions',
    icon: '?',
    schema: QUESTIONS_SCHEMA,
    renderKind: 'list-grid',
    createDefaultContent: () => ({
      columns: 2,
      showAnswers: true,
      questions: [],
    }),
    createDefaultLayout: () => ({ w: 12, h: 8 }),
  },
  callout: {
    type: 'callout',
    label: 'Callout',
    icon: '✦',
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
```

Notes:

- `renderKind` chooses the visual renderer.
- `questions` reuses the built-in `list-grid` renderer.
- `callout` uses a host-owned renderer key, `callout-card`.

## 5. Optionally Provide Custom Renderers

If a block type needs custom visuals, define a renderer registry keyed by `renderKind`.

```ts
export const WORKSHEET_RENDERERS: BlockRendererRegistry = {
  'callout-card': {
    component: WorksheetCalloutRendererComponent,
    printAdapter: ({ block }) => ({
      html: `<section class="worksheet-callout-print">${String(block.data['title'] ?? '')}</section>`,
      css: '.worksheet-callout-print { padding: 16px; }',
    }),
  },
};
```

The editor still owns:

- layout and collision rules
- drag and resize behavior
- selection state
- property panel
- undo and redo

Your renderer component owns only the inner visual content of the block.

## 6. Render The Editor

```ts
export class WorksheetEditorPage {
  document: PageDocument = createEmptyDocument();
  registry = WORKSHEET_BLOCK_REGISTRY;
  renderers = WORKSHEET_RENDERERS;
  theme: EditorTheme = {
    accentColor: '#1b5e20',
    sidebarWidthPx: 280,
    propertyPanelWidthPx: 340,
  };

  onDocumentChange(next: PageDocument): void {
    this.document = next;
  }
}
```

```html
<app-page-layout-editor
  [document]="document"
  [registry]="registry"
  [renderers]="renderers"
  [theme]="theme"
  (documentChange)="onDocumentChange($event)"
/>
```

## 7. Persist JSON

Persist the serialized JSON form, not the live runtime objects.

```ts
const payload = serializeDocument(this.document);
localStorage.setItem('worksheet-document', JSON.stringify(payload));
```

## 8. Hydrate Saved JSON

Hydrate saved JSON with the same host registry that defines your custom block types.

```ts
const parsed = JSON.parse(storedValue) as SerializedPageDocument;
const document = hydrateDocument(parsed, WORKSHEET_BLOCK_REGISTRY);
```

If the saved JSON contains a host-owned block type such as `questions` or `callout`, hydration requires a matching registry entry at runtime.

## 9. Import / Export Boundary

Recommended boundary:

- use `serializeDocument(...)` before saving or sending to an API
- use `hydrateDocument(...)` after loading JSON from an API or storage
- treat `PageDocument` as in-memory editor state
- treat `SerializedPageDocument` as the durable wire/storage format

## 10. Extension Model

The core extension points are:

- `BlockSchema`: editable content fields
- `BlockRegistry`: block identity, defaults, layout defaults, and `renderKind`
- `BlockRendererRegistry`: host runtime and print rendering keyed by `renderKind`

If you do not provide a custom renderer for a block's `renderKind`, the editor falls back to built-in renderers:

- `image`
- `text`
- `list-grid`
- `json`
