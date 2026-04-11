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

The current package targets Angular 21 peer dependencies.

## Basic Usage

Import the public API from the package root:

```ts
import {
  PageLayoutEditor,
  createEmptyDocument,
  hydrateDocument,
  serializeDocument,
  type BlockRegistry,
  type BlockRendererRegistry,
  type PageDocument,
  type EditorTheme
} from 'page-layout-editor';
```

The editor is designed to be hosted by an Angular application that provides:

- a document JSON payload
- a block registry that defines block schemas, defaults, and `renderKind`
- an optional renderer registry keyed by `renderKind`
- optional theme overrides

## Minimal Consumer Setup

Define a host-owned block registry:

```ts
import {
  DEFAULT_BLOCK_REGISTRY,
  type BlockRegistry,
  type BlockSchema,
} from 'page-layout-editor';

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
    schema: {
      typeLabel: 'Callout',
      properties: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea' },
        { key: 'accentColor', label: 'Accent Color', type: 'color' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
      ],
    },
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

Define optional host renderers:

```ts
import {
  type BlockRendererRegistry,
  type BlockRendererContext,
} from 'page-layout-editor';

export const WORKSHEET_RENDERERS: BlockRendererRegistry = {
  'callout-card': {
    component: WorksheetCalloutRendererComponent,
    printAdapter: ({ block }: BlockRendererContext) => ({
      html: `<section class="worksheet-callout-print">${String(block.data['title'] ?? '')}</section>`,
      css: '.worksheet-callout-print { padding: 16px; }',
    }),
  },
};
```

Render the editor from the host component:

```ts
document: PageDocument = createEmptyDocument();
registry = WORKSHEET_BLOCK_REGISTRY;
renderers = WORKSHEET_RENDERERS;
theme: EditorTheme = {
  accentColor: '#1b5e20',
  sidebarWidthPx: 280,
  propertyPanelWidthPx: 340,
};
```

```html
<app-page-layout-editor
  [document]="document"
  [registry]="registry"
  [renderers]="renderers"
  [theme]="theme"
  (documentChange)="document = $event"
/>
```

## Import / Export

The durable format is JSON. Persist serialized documents and hydrate them back into runtime editor state.

```ts
import {
  hydrateDocument,
  serializeDocument,
  type SerializedPageDocument,
} from 'page-layout-editor';

const savedJson: SerializedPageDocument = serializeDocument(document);
localStorage.setItem('worksheet-document', JSON.stringify(savedJson));

const parsed = JSON.parse(localStorage.getItem('worksheet-document') ?? '{}') as SerializedPageDocument;
const hydrated = hydrateDocument(parsed, WORKSHEET_BLOCK_REGISTRY);
```

If your saved JSON contains host-owned block types such as `questions` or `callout`, the consuming app must provide matching registry entries at hydration time.

## Document Model

The editor persists a JSON document with separate `blocks`, `layout`, and `page` sections. The JSON document is the durable format. At runtime, the editor hydrates that structure into layout-aware editor state.

See the repository documentation for the higher-level document and layout semantics:

- `BLOCK_SCHEME_LAYOUT_BLOCK_DESIGN.md`
- `projects/page-layout-editor/src/lib/README.md`

## Extensible Rendering

There are three distinct extension points:

- `BlockSchema`: editable content fields shown in the property panel
- `BlockRegistry`: block identity, defaults, layout defaults, and `renderKind`
- `BlockRendererRegistry`: host-provided runtime and print rendering keyed by `renderKind`

If no host renderer is registered for a block's `renderKind`, the editor falls back to the built-in renderers:

- `image`
- `text`
- `list-grid`
- `json`

## Development

Build the library:

```bash
npx ng build page-layout-editor
```

The published package is generated into `dist/page-layout-editor`.
