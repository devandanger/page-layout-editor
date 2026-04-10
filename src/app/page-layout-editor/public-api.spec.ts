import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_BLOCK_REGISTRY,
  EditorAction,
  EditorTheme,
  hydrateDocument,
  PageDocument,
  BlockRenderKind,
  PageLayoutEditorConfig,
  PageLayoutEditor,
  serializeDocument,
} from './public-api';
import { PrintService } from '../services/print.service';

describe('page-layout-editor public API', () => {
  it('supports document hydration and serialization from the public entrypoint', () => {
    const document = hydrateDocument(
      {
        version: 1,
        blocks: [{ id: 'block-1', blockType: 'text', data: { content: 'Public API' } }],
        layout: [{ id: 'layout-1', blockId: 'block-1', x: 0, y: 0, w: 12, h: 4 }],
        page: {},
      },
      DEFAULT_BLOCK_REGISTRY
    );

    const serialized = serializeDocument(document);

    expect(serialized.blocks[0]).toEqual({
      id: 'block-1',
      blockType: 'text',
      data: { content: 'Public API' },
    });
    expect(serialized.layout[0]).toMatchObject({ blockId: 'block-1', w: 12, h: 4 });
  });

  it('allows a host app to instantiate the editor through the public entrypoint', async () => {
    await TestBed.configureTestingModule({
      imports: [PageLayoutEditor],
      providers: [
        {
          provide: PrintService,
          useValue: {
            openPrintPreview: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const document: PageDocument = hydrateDocument(
      {
        version: 1,
        blocks: [{ id: 'block-1', blockType: 'text', data: { content: 'Host consumer' } }],
        layout: [{ id: 'layout-1', blockId: 'block-1', x: 0, y: 0, w: 12, h: 4 }],
        page: {},
      },
      DEFAULT_BLOCK_REGISTRY
    );
    const theme: EditorTheme = { accentColor: '#123456' };
    const renderKind: BlockRenderKind = 'text';
    const config: PageLayoutEditorConfig = { readonly: false, historyLimit: 25 };
    const actionSpy = vi.fn<(event: EditorAction) => void>();

    const fixture = TestBed.createComponent(PageLayoutEditor);
    fixture.componentRef.setInput('document', document);
    fixture.componentRef.setInput('registry', DEFAULT_BLOCK_REGISTRY);
    fixture.componentRef.setInput('theme', theme);
    fixture.componentRef.setInput('config', config);
    fixture.componentInstance.action.subscribe(actionSpy);
    fixture.detectChanges();

    fixture.componentInstance.selectBlock('block-1');

    expect(fixture.componentInstance.selectedBlock()?.id).toBe('block-1');
    expect(renderKind).toBe('text');
    expect(actionSpy).toHaveBeenCalledWith({ type: 'select', blockId: 'block-1' });
  });
});
