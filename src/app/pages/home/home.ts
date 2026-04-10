import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../services/content.service';
import {
  EditorTheme,
  PageDocument,
  SerializedContentBlock,
  SerializedPageDocument,
  hydrateDocument,
  serializeDocument,
} from 'page-layout-editor';
import { DEMO_BLOCK_REGISTRY } from '../../demo-block-registry';

interface SizePreset {
  label: string;
  width: number;
  height: number;
}

interface ApiInput {
  name: string;
  type: string;
  description: string;
}

interface ApiOutput {
  name: string;
  type: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private router = inject(Router);
  private contentService = inject(ContentService);

  jsonText = signal('');
  jsonError = signal('');
  data = this.contentService.data;
  pageSize = this.contentService.pageSize;
  registry = DEMO_BLOCK_REGISTRY;
  theme: EditorTheme = {
    accentColor: '#1b5e20',
    sidebarWidthPx: 280,
    propertyPanelWidthPx: 340,
  };
  libraryOwns = [
    'editor menu, page surface, left sidebar, and property panel',
    'layout rules, collisions, drag/resize behavior, keyboard movement, and undo/redo',
    'document model types, block registry contract, and render-kind behavior',
    'block lifecycle actions and editor-level feedback states',
  ];
  hostOwns = [
    'routing and application shell',
    'loading, saving, autosave, and backend integration',
    'auth, permissions, and product-specific validation',
    'supplying the document, registry, custom block definitions, and optional theming inputs',
  ];
  apiInputs: ApiInput[] = [
    { name: 'document', type: 'PageDocument', description: 'Current editor document passed in by the consuming app.' },
    { name: 'registry', type: 'BlockRegistry', description: 'Available block definitions, schemas, defaults, and render behavior.' },
    { name: 'theme', type: 'EditorTheme | undefined', description: 'Optional visual tokens for chrome, accent colors, and sizing.' },
    { name: 'config', type: 'PageLayoutEditorConfig | undefined', description: 'Optional feature flags, readonly mode, and history settings.' },
  ];
  apiOutputs: ApiOutput[] = [
    { name: 'documentChange', type: 'PageDocument', description: 'Emits the next full document after an edit.' },
    { name: 'selectionChange', type: 'string | null', description: 'Emits the currently selected block id.' },
    { name: 'action', type: 'EditorAction', description: 'Optional editor action stream for telemetry, analytics, or host workflows.' },
  ];
  consumerExample = `<app-page-layout-editor
  [document]="worksheetDocument"
  [registry]="worksheetBlockRegistry"
  [theme]="worksheetEditorTheme"
  [config]="worksheetEditorConfig"
  (documentChange)="onDocumentChange($event)"
  (selectionChange)="onSelectionChange($event)"
  (action)="onEditorAction($event)"
/>`;
  documentExample = `const worksheetDocument: PageDocument = {
  blocks: [
    { id: 'block-1', blockType: 'image', data: { ... } },
    { id: 'block-2', blockType: 'text', data: { ... } }
  ],
  layout: [
    { id: 'layout-1', blockId: 'block-1', x: 0, y: 0, w: 12, h: 6 },
    { id: 'layout-2', blockId: 'block-2', x: 0, y: 6, w: 12, h: 4 }
  ],
  page: {
    widthPx: 816,
    heightPx: 1056,
    gridCols: 12,
    rowHeightPx: 40,
    gapPx: 8
  }
};`;
  registryExample = `const worksheetBlockRegistry: BlockRegistry = {
  image: {
    type: 'image',
    label: 'Image',
    schema: IMAGE_SCHEMA,
    renderKind: 'image',
    createDefaultContent: () => ({ src: '', alt: '' }),
    createDefaultLayout: () => ({ w: 12, h: 6 }),
  },
  text: {
    type: 'text',
    label: 'Text',
    schema: TEXT_SCHEMA,
    renderKind: 'text',
    createDefaultContent: () => ({ content: '' }),
    createDefaultLayout: () => ({ w: 12, h: 4 }),
  },
  questions: {
    type: 'questions',
    label: 'Questions',
    schema: QUESTIONS_SCHEMA,
    renderKind: 'list-grid',
    createDefaultContent: () => ({ columns: 2, showAnswers: true, questions: [] }),
    createDefaultLayout: () => ({ w: 12, h: 8 }),
  }
};`;
  renderKindExample = `const worksheetBlockRegistry: BlockRegistry = {
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
};`;
  themeExample = `const worksheetEditorTheme: EditorTheme = {
  accentColor: '#1b5e20',
  sidebarWidthPx: 280,
  propertyPanelWidthPx: 340,
};`;
  configExample = `const worksheetEditorConfig: PageLayoutEditorConfig = {
  readonly: false,
  historyLimit: 100,
  features: {
    addBlocks: true,
    duplicateBlocks: true,
    deleteBlocks: true,
    printPreview: true,
    keyboardNudge: true,
    resize: true,
    drag: true,
  },
};`;

  presets: SizePreset[] = [
    { label: 'US Letter (8.5" x 11")', width: 816, height: 1056 },
    { label: 'US Letter Landscape', width: 1056, height: 816 },
    { label: 'A4 (210mm x 297mm)', width: 794, height: 1123 },
    { label: 'A4 Landscape', width: 1123, height: 794 },
    { label: 'iPad (768 x 1024)', width: 768, height: 1024 },
    { label: 'iPad Landscape', width: 1024, height: 768 },
    { label: 'Desktop HD (1280 x 720)', width: 1280, height: 720 },
    { label: 'Full HD (1920 x 1080)', width: 1920, height: 1080 },
    { label: 'Custom', width: 0, height: 0 },
  ];

  constructor() {
    effect(() => {
      this.data();
      this.syncJsonText();
    });
  }

  private syncJsonText(): void {
    this.jsonText.set(JSON.stringify(serializeDocument(this.data()), null, 2));
    this.jsonError.set('');
  }

  onJsonChange(value: string): void {
    this.jsonText.set(value);
    try {
      const parsed = JSON.parse(value) as SerializedPageDocument | SerializedContentBlock[];
      const document = hydrateDocument(parsed, this.registry);
      this.contentService.update(document);
      this.jsonError.set('');
    } catch (e: any) {
      this.jsonError.set(e.message);
    }
  }

  onWidthChange(value: number): void {
    this.contentService.updatePageSize({
      ...this.pageSize(),
      widthPx: value,
    });
  }

  onHeightChange(value: number): void {
    this.contentService.updatePageSize({
      ...this.pageSize(),
      heightPx: value,
    });
  }

  applyPreset(preset: SizePreset): void {
    if (preset.width === 0) return;
    this.contentService.updatePage({
      widthPx: preset.width,
      heightPx: preset.height,
    });
  }

  resetData(): void {
    this.contentService.reset();
    this.syncJsonText();
  }

  openEditor(route: string): void {
    this.router.navigate([route]);
  }

  getPreviewValue(value: unknown): string {
    if (Array.isArray(value)) return `${value.length} items`;
    return String(value ?? '');
  }

  getLayoutSummary(blockId: string): string | null {
    const layout = this.data().layout.find((item) => item.blockId === blockId);
    if (!layout) return null;
    return `x ${layout.x}, y ${layout.y}, w ${layout.w}, h ${layout.h}`;
  }

  get exampleDocument(): PageDocument {
    return this.data();
  }
}
