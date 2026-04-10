import { TestBed } from '@angular/core/testing';
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest';
import { PageLayoutEditor } from './page-layout-editor';
import { BlockRegistry, ContentBlock, LayoutBlock, PageDocument } from '../../models/content-block.model';
import { IMAGE_SCHEMA, TEXT_SCHEMA } from '../../models/block-schemas';
import { DefaultPrintAdapter } from '../../services/default-print-adapter';

function createDocument(): PageDocument {
  const blocks: ContentBlock[] = [
    {
      id: 'block-1',
      blockType: 'image',
      schema: IMAGE_SCHEMA,
      data: {
        src: 'https://example.com/image.png',
        alt: 'Image',
        objectFit: 'contain',
        borderRadius: 4,
        backgroundColor: '#e8f5e9',
      },
    },
    {
      id: 'block-2',
      blockType: 'text',
      schema: TEXT_SCHEMA,
      data: {
        content: 'Hello world',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: '#ffffff',
      },
    },
  ];

  const layout: LayoutBlock[] = [
    {
      id: 'layout-1',
      blockId: 'block-1',
      x: 0,
      y: 0,
      w: 6,
      h: 6,
      locked: false,
      hidden: false,
      zIndex: 0,
    },
    {
      id: 'layout-2',
      blockId: 'block-2',
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      locked: false,
      hidden: false,
      zIndex: 1,
    },
  ];

  return {
    blocks,
    layout,
    page: {
      widthPx: 816,
      heightPx: 1056,
      gridCols: 12,
      rowHeightPx: 40,
      gapPx: 8,
    },
  };
}

describe('PageLayoutEditor', () => {
  let document: PageDocument;
  let fixture: Awaited<ReturnType<typeof TestBed.createComponent<PageLayoutEditor>>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    document = createDocument();

    await TestBed.configureTestingModule({
      imports: [PageLayoutEditor],
      providers: [
        {
          provide: DefaultPrintAdapter,
          useValue: {
            openPrintPreview: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageLayoutEditor);
    fixture.componentRef.setInput('document', document);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the property panel content for a selected block', () => {
    fixture.componentInstance.selectBlock('block-1');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.panel.empty-panel');
    expect(panel).toBeNull();
    expect(fixture.componentInstance.selectedBlock()?.id).toBe('block-1');
  });

  it('does not render hidden blocks on the page surface', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');

    fixture.componentInstance.toggleHidden('block-2');

    expect(fixture.componentInstance.positionedBlocks).toHaveLength(1);
    expect(emitSpy).toHaveBeenCalled();
    const emitted = emitSpy.mock.calls.at(-1)?.[0] as PageDocument;
    expect(emitted.layout.find((item) => item.blockId === 'block-2')).toMatchObject({ hidden: true });
  });

  it('prevents colliding layout edits from being committed', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');
    fixture.componentInstance.selectBlock('block-2');
    fixture.componentInstance.onLayoutChange({ x: 0, y: 0, w: 6, h: 6 });

    expect(emitSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.collisionBlockId()).toBe('block-2');
    expect(fixture.componentInstance.selectedLayout()).toMatchObject({
      x: 6,
      y: 0,
      w: 6,
      h: 4,
    });
  });

  it('adds a block and selects it', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');

    fixture.componentInstance.addBlock('text');

    expect(fixture.componentInstance.allBlocks).toHaveLength(3);
    expect(fixture.componentInstance.selectedBlock()?.blockType).toBe('text');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('uses the provided registry for new block creation', () => {
    const customRegistry: BlockRegistry = {
      note: {
        type: 'note',
        label: 'Note',
        schema: TEXT_SCHEMA,
        renderKind: 'text',
        createDefaultContent: () => ({ content: 'Note body' }),
        createDefaultLayout: () => ({ w: 5, h: 3 }),
      },
    };

    fixture.componentRef.setInput('registry', customRegistry);
    fixture.detectChanges();

    fixture.componentInstance.addBlock('note');

    expect(fixture.componentInstance.selectedBlock()?.blockType).toBe('note');
    expect(fixture.componentInstance.selectedLayout()).toMatchObject({ w: 5, h: 3 });
    expect(fixture.componentInstance.getRenderKind(fixture.componentInstance.selectedBlock()!)).toBe('text');
  });

  it('honors config readonly mode for document mutations', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');
    fixture.componentRef.setInput('config', { readonly: true });
    fixture.detectChanges();

    fixture.componentInstance.addBlock('text');
    fixture.componentInstance.selectBlock('block-1');
    fixture.componentInstance.onLayoutChange({ x: 1 });

    expect(fixture.componentInstance.allBlocks).toHaveLength(2);
    expect(fixture.componentInstance.selectedLayout()).toMatchObject({ x: 0 });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('honors config feature flags for block lifecycle actions', () => {
    fixture.componentRef.setInput('config', {
      features: {
        addBlocks: false,
        duplicateBlocks: false,
        deleteBlocks: false,
      },
    });
    fixture.detectChanges();

    fixture.componentInstance.addBlock('text');
    fixture.componentInstance.duplicateBlock('block-1');
    fixture.componentInstance.deleteBlock('block-1');

    expect(fixture.componentInstance.allBlocks).toHaveLength(2);
  });

  it('duplicates a block and selects the duplicate', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');

    fixture.componentInstance.duplicateBlock('block-1');

    expect(fixture.componentInstance.allBlocks).toHaveLength(3);
    expect(fixture.componentInstance.selectedBlock()?.id).not.toBe('block-1');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('deletes the selected block and clears selection', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');
    fixture.componentInstance.selectBlock('block-1');

    fixture.componentInstance.deleteBlock('block-1');

    expect(fixture.componentInstance.allBlocks).toHaveLength(1);
    expect(fixture.componentInstance.selectedBlock()).toBeNull();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('nudges the selected block with arrow keys', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');
    fixture.componentInstance.selectBlock('block-1');
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    fixture.componentInstance.onCanvasKeydown(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(fixture.componentInstance.selectedLayout()).toMatchObject({ x: 0, y: 1 });
    expect(emitSpy).toHaveBeenCalled();
  });

  it('tracks undo and redo history locally', () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.documentChange, 'emit');

    fixture.componentInstance.addBlock('text');
    expect(fixture.componentInstance.canUndo()).toBe(true);
    expect(fixture.componentInstance.canRedo()).toBe(false);
    expect(fixture.componentInstance.allBlocks).toHaveLength(3);

    fixture.componentInstance.undo();
    expect(fixture.componentInstance.allBlocks).toHaveLength(2);
    expect(fixture.componentInstance.canRedo()).toBe(true);

    fixture.componentInstance.redo();
    expect(fixture.componentInstance.allBlocks).toHaveLength(3);
    expect(fixture.componentInstance.canUndo()).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(3);
  });

  it('honors the configured history limit', () => {
    fixture.componentRef.setInput('config', { historyLimit: 1 });
    fixture.detectChanges();

    fixture.componentInstance.addBlock('text');
    fixture.componentInstance.addBlock('text');
    fixture.componentInstance.undo();
    fixture.componentInstance.undo();

    expect(fixture.componentInstance.allBlocks).toHaveLength(3);
    expect(fixture.componentInstance.canUndo()).toBe(false);
  });

  it('emits editor actions for host integrations', () => {
    const actionSpy = vi.spyOn(fixture.componentInstance.action, 'emit');

    fixture.componentInstance.addBlock('text');
    fixture.componentInstance.undo();

    expect(actionSpy.mock.calls.some(([event]) => event.type === 'add-block' && event.blockType === 'text')).toBe(true);
    expect(actionSpy.mock.calls.some(([event]) => event.type === 'undo')).toBe(true);
  });

  it('shows live invalid outline state while dragging into a collision', () => {
    fixture.componentInstance.onDragMoved('block-2', {
      distance: { x: -300, y: 0 },
    } as any);

    expect(fixture.componentInstance.dragCollisionBlockId()).toBe('block-2');

    fixture.componentInstance.onDragMoved('block-2', {
      distance: { x: 0, y: 240 },
    } as any);

    expect(fixture.componentInstance.dragCollisionBlockId()).toBeNull();
  });

  it('shows live invalid outline state while resizing into a collision', () => {
    fixture.componentInstance.startResize(
      'block-1',
      new PointerEvent('pointerdown', { clientX: 0, clientY: 0 })
    );
    (fixture.componentInstance as any).onResizeMove(
      new PointerEvent('pointermove', { clientX: 80, clientY: 0 })
    );

    expect(fixture.componentInstance.resizeCollisionBlockId()).toBe('block-1');
  });

  it('clears collision feedback after a short delay', () => {
    fixture.componentInstance.selectBlock('block-2');
    fixture.componentInstance.onLayoutChange({ x: 0, y: 0, w: 6, h: 6 });

    expect(fixture.componentInstance.collisionBlockId()).toBe('block-2');

    vi.advanceTimersByTime(901);

    expect(fixture.componentInstance.collisionBlockId()).toBeNull();
    expect(fixture.componentInstance.collisionMessage()).toBeNull();
  });
});
