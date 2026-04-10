import { Component, effect, inject, input, output, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd, CdkDragHandle, CdkDragMove } from '@angular/cdk/drag-drop';
import { DefaultPrintAdapter } from '../../services/default-print-adapter';
import {
  BlockRegistry,
  BlockRendererContext,
  BlockRendererDefinition,
  BlockRendererRegistry,
  BlockRenderKind,
  ContentBlock,
  EditorAction,
  EditorTheme,
  LayoutBlock,
  PageDocument,
  PageLayoutEditorConfig,
  PageSettings,
  PageSize,
  ResolvedPageLayoutEditorConfig,
} from '../../models/content-block.model';
import { PropertyPanel } from '../property-panel/property-panel';
import { EditorMenu } from '../editor-menu/editor-menu';
import { createDefaultDocument, createId, DEFAULT_BLOCK_REGISTRY, getBlockTypeOptions } from '../../models/block-schemas';
import {
  getGridUnitX,
  getGridUnitY,
  getMaxRows,
  getNudgedLayout,
  getPositionedLayout,
  hasCollision,
  NudgeDirection,
  normalizeLayout,
} from '../../utils/layout-utils';

interface PositionedBlock {
  block: ContentBlock;
  layout: LayoutBlock;
}

const DEFAULT_EDITOR_CONFIG: ResolvedPageLayoutEditorConfig = {
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
};

@Component({
  selector: 'app-page-layout-editor',
  imports: [CommonModule, CdkDrag, CdkDragHandle, PropertyPanel, EditorMenu],
  templateUrl: './page-layout-editor.html',
  styleUrl: './page-layout-editor.scss',
})
export class PageLayoutEditor implements OnDestroy {
  private printAdapter = inject(DefaultPrintAdapter);

  documentInput = input<PageDocument | null>(null, { alias: 'document' });
  registry = input<BlockRegistry>(DEFAULT_BLOCK_REGISTRY);
  renderers = input<BlockRendererRegistry | null>(null);
  theme = input<EditorTheme | null>(null);
  config = input<PageLayoutEditorConfig | null>(null);
  /** Prefer config.readonly for new consumers. Kept as a compatibility input. */
  readonly = input(false);

  documentChange = output<PageDocument>();
  selectionChange = output<string | null>();
  action = output<EditorAction>();
  backRequested = output<void>();

  document: PageDocument = structuredClone(createDefaultDocument());
  pageSize: PageSize = {
    widthPx: this.document.page.widthPx,
    heightPx: this.document.page.heightPx,
  };
  canUndo = signal(false);
  canRedo = signal(false);
  selectedBlockId = signal<string | null>(null);
  resizingBlockId = signal<string | null>(null);
  resizePreviewLayout = signal<LayoutBlock | null>(null);
  dragCollisionBlockId = signal<string | null>(null);
  resizeCollisionBlockId = signal<string | null>(null);
  collisionBlockId = signal<string | null>(null);
  collisionMessage = signal<string | null>(null);
  private collisionTimer: ReturnType<typeof setTimeout> | null = null;
  private history: PageDocument[] = [];
  private future: PageDocument[] = [];
  private lastSnapshot = this.snapshotDocument(this.document);
  private resizeState:
    | {
        startClientX: number;
        startClientY: number;
        startLayout: LayoutBlock;
      }
    | null = null;
  private readonly boundResizeMove = (event: PointerEvent) => this.onResizeMove(event);
  private readonly boundResizeEnd = () => this.finishResize();

  constructor() {
    effect(() => {
      const incoming = this.documentInput();
      if (!incoming) return;
      const incomingSnapshot = this.snapshotDocument(incoming);
      if (incomingSnapshot === this.lastSnapshot) return;
      this.document = structuredClone(incoming);
      this.pageSize = {
        widthPx: this.document.page.widthPx,
        heightPx: this.document.page.heightPx,
      };
      this.lastSnapshot = incomingSnapshot;
      this.history = [];
      this.future = [];
      this.syncHistoryFlags();
    });
  }

  ngOnDestroy(): void {
    this.finishResize();
    this.clearCollisionFeedback();
  }

  get page(): PageSettings {
    return this.document.page;
  }

  get blockTypeOptions() {
    return getBlockTypeOptions(this.registry());
  }

  get accentColor(): string {
    return this.theme()?.accentColor ?? '#1b5e20';
  }

  get sidebarWidthPx(): number {
    return this.theme()?.sidebarWidthPx ?? 280;
  }

  get propertyPanelWidthPx(): number {
    return this.theme()?.propertyPanelWidthPx ?? 340;
  }

  get editorConfig(): ResolvedPageLayoutEditorConfig {
    const config = this.config();
    return {
      readonly: config?.readonly ?? this.readonly(),
      historyLimit: config?.historyLimit ?? DEFAULT_EDITOR_CONFIG.historyLimit,
      features: {
        ...DEFAULT_EDITOR_CONFIG.features,
        ...(config?.features ?? {}),
      },
    };
  }

  get isReadonly(): boolean {
    return this.editorConfig.readonly;
  }

  isFeatureEnabled(feature: keyof ResolvedPageLayoutEditorConfig['features']): boolean {
    return this.editorConfig.features[feature];
  }

  get allBlocks(): ContentBlock[] {
    return this.document.blocks;
  }

  get positionedBlocks(): PositionedBlock[] {
    return this.document.layout
      .filter((layout) => !layout.hidden)
      .map((layout) => ({
        layout,
        block: this.getBlock(layout.blockId)!,
      }))
      .filter((item) => !!item.block)
      .sort(
        (a, b) =>
          (a.layout.zIndex ?? 0) - (b.layout.zIndex ?? 0) ||
          a.layout.y - b.layout.y ||
          a.layout.x - b.layout.x
      );
  }

  selectBlock(blockId: string): void {
    this.selectedBlockId.set(blockId);
    this.selectionChange.emit(blockId);
    this.action.emit({ type: 'select', blockId });
  }

  selectedBlock(): ContentBlock | null {
    const blockId = this.selectedBlockId();
    return blockId ? this.getBlock(blockId) ?? null : null;
  }

  selectedLayout(): LayoutBlock | null {
    const blockId = this.selectedBlockId();
    return blockId ? this.getLayout(blockId) ?? null : null;
  }

  isSelected(blockId: string): boolean {
    return this.selectedBlockId() === blockId;
  }

  isResizing(blockId: string): boolean {
    return this.resizingBlockId() === blockId;
  }

  onBlockChange(updated: ContentBlock): void {
    const index = this.document.blocks.findIndex((block) => block.id === updated.id);
    if (index === -1 || this.isReadonly) return;
    this.commitMutation(() => {
      this.document.blocks[index] = structuredClone(updated);
    });
  }

  onLayoutChange(patch: Partial<LayoutBlock>): void {
    const current = this.selectedLayout();
    if (!current || this.isReadonly) return;

    const next = normalizeLayout({ ...current, ...patch }, this.page);
    const index = this.document.layout.findIndex((layout) => layout.id === current.id);
    if (index === -1) return;
    if (hasCollision(next, this.document.layout)) {
      this.showCollisionFeedback(current.blockId);
      return;
    }

    this.commitMutation(() => {
      this.document.layout[index] = next;
    });
  }

  toggleHidden(blockId: string): void {
    if (this.isReadonly) return;
    const layout = this.getLayout(blockId);
    if (!layout) return;
    this.applyLayoutUpdate(layout, { hidden: !layout.hidden });
    this.action.emit({ type: 'toggle-hidden', blockId });
    if (layout.hidden === false && this.selectedBlockId() === blockId) {
      this.closePanel();
    }
  }

  toggleLocked(blockId: string): void {
    if (this.isReadonly) return;
    const layout = this.getLayout(blockId);
    if (!layout) return;
    this.applyLayoutUpdate(layout, { locked: !layout.locked });
    this.action.emit({ type: 'toggle-locked', blockId });
  }

  bringForward(blockId: string): void {
    if (this.isReadonly) return;
    const layout = this.getLayout(blockId);
    if (!layout) return;
    this.applyLayoutUpdate(layout, { zIndex: (layout.zIndex ?? 0) + 1 });
    this.action.emit({ type: 'bring-forward', blockId });
  }

  sendBackward(blockId: string): void {
    if (this.isReadonly) return;
    const layout = this.getLayout(blockId);
    if (!layout) return;
    this.applyLayoutUpdate(layout, { zIndex: Math.max(0, (layout.zIndex ?? 0) - 1) });
    this.action.emit({ type: 'send-backward', blockId });
  }

  onDragEnded(blockId: string, event: CdkDragEnd): void {
    const layout = this.getLayout(blockId);
    if (!layout || layout.locked || this.isReadonly || !this.isFeatureEnabled('drag')) {
      this.dragCollisionBlockId.set(null);
      event.source.reset();
      return;
    }

    const next = this.getDraggedLayout(layout, event.distance);
    const index = this.document.layout.findIndex((item) => item.id === layout.id);
    if (index !== -1) {
      if (hasCollision(next, this.document.layout)) {
        this.showCollisionFeedback(blockId);
      } else {
        this.commitMutation(() => {
          this.document.layout[index] = next;
        });
      }
    }

    this.dragCollisionBlockId.set(null);
    event.source.reset();
  }

  onDragMoved(blockId: string, event: CdkDragMove): void {
    const layout = this.getLayout(blockId);
    if (!layout || layout.locked || this.isReadonly || !this.isFeatureEnabled('drag')) {
      this.dragCollisionBlockId.set(null);
      return;
    }

    const next = this.getDraggedLayout(layout, event.distance);
    this.dragCollisionBlockId.set(hasCollision(next, this.document.layout) ? blockId : null);
  }

  startResize(blockId: string, event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const layout = this.getLayout(blockId);
    if (!layout || layout.locked || this.isReadonly || !this.isFeatureEnabled('resize')) return;

    this.selectBlock(blockId);
    this.resizingBlockId.set(blockId);
    this.resizePreviewLayout.set(structuredClone(layout));
    this.resizeState = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLayout: structuredClone(layout),
    };

    window.addEventListener('pointermove', this.boundResizeMove);
    window.addEventListener('pointerup', this.boundResizeEnd);
    window.addEventListener('pointercancel', this.boundResizeEnd);
  }

  closePanel(): void {
    this.selectedBlockId.set(null);
    this.selectionChange.emit(null);
  }

  onCanvasKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }

    const blockId = this.selectedBlockId();
    if (!blockId) return;

    const direction = this.getNudgeDirection(event.key);
    if (!direction) return;
    if (!this.isFeatureEnabled('keyboardNudge')) return;

    const layout = this.getLayout(blockId);
    if (!layout || layout.locked || layout.hidden || this.isReadonly) return;

    event.preventDefault();
    const step = event.shiftKey ? 4 : 1;
    const next = getNudgedLayout(layout, direction, step, this.page);
    if (next.x === layout.x && next.y === layout.y) return;
    if (hasCollision(next, this.document.layout)) {
      this.showCollisionFeedback(blockId);
      return;
    }

    const index = this.document.layout.findIndex((item) => item.id === layout.id);
    if (index === -1) return;

    this.commitMutation(() => {
      this.document.layout[index] = next;
    });
  }

  addBlock(blockType: string): void {
    if (this.isReadonly || !this.isFeatureEnabled('addBlocks')) return;
    const definition = this.registry()[blockType];
    if (!definition) return;

    const block: ContentBlock = {
      id: createId('block'),
      blockType: definition.type,
      schema: definition.schema,
      data: structuredClone(definition.createDefaultContent()),
    };

    const bottom = this.document.layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const zIndex = this.document.layout.reduce((max, item) => Math.max(max, item.zIndex ?? 0), -1) + 1;
    const defaultLayout = definition.createDefaultLayout?.() ?? { w: 12, h: 4 };
    let nextPage = this.page;
    let layout = normalizeLayout(
      {
        id: createId('layout'),
        blockId: block.id,
        x: 0,
        y: bottom,
        w: Number(defaultLayout.w ?? 12),
        h: Number(defaultLayout.h ?? 4),
        locked: false,
        hidden: false,
        zIndex,
      },
      this.page
    );

    if (hasCollision(layout, this.document.layout)) {
      nextPage = this.ensurePageRows(this.page, bottom + layout.h);
      layout = normalizeLayout({ ...layout, y: bottom }, nextPage);
    }

    this.commitMutation(() => {
      this.document = {
        ...this.document,
        blocks: [...this.document.blocks, block],
        layout: [...this.document.layout, layout],
        page: nextPage,
      };
      this.pageSize = { widthPx: nextPage.widthPx, heightPx: nextPage.heightPx };
    });
    this.selectBlock(block.id);
    this.action.emit({ type: 'add-block', blockId: block.id, blockType });
  }

  duplicateBlock(blockId: string): void {
    if (this.isReadonly || !this.isFeatureEnabled('duplicateBlocks')) return;
    const sourceBlock = this.getBlock(blockId);
    const sourceLayout = this.getLayout(blockId);
    if (!sourceBlock || !sourceLayout) return;

    const block: ContentBlock = {
      ...structuredClone(sourceBlock),
      id: createId('block'),
    };

    const startZIndex = this.document.layout.reduce((max, item) => Math.max(max, item.zIndex ?? 0), -1) + 1;
    let nextPage = this.page;
    let layout = normalizeLayout(
      {
        ...structuredClone(sourceLayout),
        id: createId('layout'),
        blockId: block.id,
        x: sourceLayout.x + 1,
        y: sourceLayout.y + 1,
        locked: false,
        hidden: false,
        zIndex: startZIndex,
      },
      this.page
    );

    for (let attempt = 0; attempt < 24 && hasCollision(layout, this.document.layout); attempt += 1) {
      layout = normalizeLayout(
        { ...layout, x: sourceLayout.x, y: sourceLayout.y + attempt + 2 },
        this.page
      );
    }

    if (hasCollision(layout, this.document.layout)) {
      const bottom = this.document.layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      nextPage = this.ensurePageRows(this.page, bottom + layout.h);
      layout = normalizeLayout({ ...layout, x: 0, y: bottom }, nextPage);
    }

    this.commitMutation(() => {
      this.document = {
        ...this.document,
        blocks: [...this.document.blocks, block],
        layout: [...this.document.layout, layout],
        page: nextPage,
      };
      this.pageSize = { widthPx: nextPage.widthPx, heightPx: nextPage.heightPx };
    });
    this.selectBlock(block.id);
    this.action.emit({ type: 'duplicate-block', blockId: block.id, blockType: block.blockType });
  }

  deleteBlock(blockId: string): void {
    if (this.isReadonly || !this.isFeatureEnabled('deleteBlocks')) return;
    this.commitMutation(() => {
      this.document = {
        ...this.document,
        blocks: this.document.blocks.filter((block) => block.id !== blockId),
        layout: this.document.layout.filter((layout) => layout.blockId !== blockId),
      };
    });
    if (this.selectedBlockId() === blockId) {
      this.closePanel();
    }
    this.action.emit({ type: 'delete-block', blockId });
  }

  undo(): void {
    if (!this.history.length) return;
    this.future.unshift(structuredClone(this.document));
    this.document = this.history.pop()!;
    this.pageSize = {
      widthPx: this.document.page.widthPx,
      heightPx: this.document.page.heightPx,
    };
    this.lastSnapshot = this.snapshotDocument(this.document);
    this.syncHistoryFlags();
    this.documentChange.emit(structuredClone(this.document));
    this.action.emit({ type: 'undo', blockId: this.selectedBlockId() });
  }

  redo(): void {
    if (!this.future.length) return;
    this.history.push(structuredClone(this.document));
    this.document = this.future.shift()!;
    this.pageSize = {
      widthPx: this.document.page.widthPx,
      heightPx: this.document.page.heightPx,
    };
    this.lastSnapshot = this.snapshotDocument(this.document);
    this.syncHistoryFlags();
    this.documentChange.emit(structuredClone(this.document));
    this.action.emit({ type: 'redo', blockId: this.selectedBlockId() });
  }

  back(): void {
    this.action.emit({ type: 'back', blockId: this.selectedBlockId() });
    this.backRequested.emit();
  }

  onPrintPreview(): void {
    if (!this.isFeatureEnabled('printPreview')) return;
    const html = this.positionedBlocks
      .map(({ block, layout }) => this.renderBlockHtml(block, layout))
      .join('\n');
    const css = `
      .print-page {
        position: relative;
        width: ${this.page.widthPx}px;
        min-height: ${this.page.heightPx}px;
        background: #fff;
      }
      .print-block {
        position: absolute;
        overflow: hidden;
        border-radius: 8px;
      }
      .print-block img {
        width: 100%;
        height: 100%;
        display: block;
      }
      .print-block p {
        margin: 0;
        line-height: 1.6;
      }
      .print-list-grid {
        display: grid;
        gap: 8px;
      }
      .print-q-item {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 4px;
        font-size: 14px;
      }
      .print-q-num {
        font-weight: 600;
        margin-right: 4px;
      }
      .print-q-answer {
        color: #2e7d32;
        margin-left: 4px;
      }
    `;
    this.printAdapter.openPrintPreview(`<div class="print-page">${html}</div>`, css, this.pageSize);
    this.action.emit({ type: 'print-preview', blockId: this.selectedBlockId() });
  }

  trackByBlockId(_: number, item: PositionedBlock): string {
    return item.block.id;
  }

  getLeftPx(layout: LayoutBlock): number {
    return getPositionedLayout(this.getRenderedLayout(layout), this.page).left;
  }

  getTopPx(layout: LayoutBlock): number {
    return getPositionedLayout(this.getRenderedLayout(layout), this.page).top;
  }

  getWidthPx(layout: LayoutBlock): number {
    return getPositionedLayout(this.getRenderedLayout(layout), this.page).width;
  }

  getHeightPx(layout: LayoutBlock): number {
    return getPositionedLayout(this.getRenderedLayout(layout), this.page).height;
  }

  getQuestions(block: ContentBlock): Array<Record<string, unknown>> {
    return Array.isArray(block.data['questions'])
      ? (block.data['questions'] as Array<Record<string, unknown>>)
      : [];
  }

  getCustomRenderer(block: ContentBlock): BlockRendererDefinition | null {
    const renderKind = this.getRenderKind(block);
    return this.renderers()?.[renderKind] ?? null;
  }

  getRendererContext(block: ContentBlock, layout: LayoutBlock): Record<string, unknown> {
    const context: BlockRendererContext = {
      block,
      layout,
      selected: this.isSelected(block.id),
      readonly: this.isReadonly,
    };
    return context as unknown as Record<string, unknown>;
  }

  getRenderKind(block: ContentBlock): BlockRenderKind {
    return this.registry()[block.blockType]?.renderKind ?? (block.blockType as BlockRenderKind) ?? 'json';
  }

  private getBlock(blockId: string): ContentBlock | undefined {
    return this.document.blocks.find((block) => block.id === blockId);
  }

  getLayout(blockId: string): LayoutBlock | undefined {
    return this.document.layout.find((layout) => layout.blockId === blockId);
  }

  private applyLayoutUpdate(layout: LayoutBlock, patch: Partial<LayoutBlock>): void {
    const next = normalizeLayout({ ...layout, ...patch }, this.page);
    const index = this.document.layout.findIndex((item) => item.id === layout.id);
    if (index === -1) return;
    if (!next.hidden && hasCollision(next, this.document.layout)) {
      this.showCollisionFeedback(layout.blockId);
      return;
    }
    this.commitMutation(() => {
      this.document.layout[index] = next;
    });
  }

  private ensurePageRows(page: PageSettings, requiredRows: number): PageSettings {
    if (requiredRows <= getMaxRows(page)) return page;
    return {
      ...page,
      heightPx: requiredRows * (page.rowHeightPx + page.gapPx) - page.gapPx,
    };
  }

  private renderBlockHtml(block: ContentBlock, layout: LayoutBlock): string {
    const d = block.data;
    const style = [
      `left:${this.getLeftPx(layout)}px`,
      `top:${this.getTopPx(layout)}px`,
      `width:${this.getWidthPx(layout)}px`,
      `height:${this.getHeightPx(layout)}px`,
      `z-index:${layout.zIndex ?? 0}`,
    ].join(';');

    switch (this.getRenderKind(block)) {
      case 'image':
        return `<div class="print-block" style="${style};background:${this.escapeStyleColor(d['backgroundColor'], '#ffffff')}"><img src="${this.escapeAttr(
          d['src']
        )}" alt="${this.escapeAttr(d['alt'])}" style="object-fit:${this.escapeCssKeyword(
          d['objectFit'],
          'contain'
        )};border-radius:${this.escapeNumber(d['borderRadius'], 4)}px" /></div>`;
      case 'text':
        return `<div class="print-block" style="${style};background:${this.escapeStyleColor(
          d['backgroundColor'],
          '#ffffff'
        )};padding:16px;font-size:${this.escapeNumber(d['fontSize'], 14)}px;font-weight:${this.escapeCssKeyword(
          d['fontWeight'],
          'normal'
        )};text-align:${this.escapeCssKeyword(d['textAlign'], 'left')}"><p>${this.escapeHtml(
          d['content']
        )}</p></div>`;
      case 'list-grid': {
        const questions = Array.isArray(d['questions']) ? d['questions'] : [];
        const showAnswers = d['showAnswers'] !== false;
        const columns = Math.max(1, this.escapeNumber(d['columns'], 2));
        const items = questions
          .map((q, index) => {
            const question = typeof q === 'object' && q ? this.escapeHtml((q as Record<string, unknown>)['question']) : '';
            const answer = typeof q === 'object' && q ? this.escapeHtml((q as Record<string, unknown>)['answer']) : '';
            return `<div class="print-q-item"><span class="print-q-num">${index + 1}.</span> ${question}${
              showAnswers ? ` <span class="print-q-answer">= ${answer}</span>` : ''
            }</div>`;
          })
          .join('');
        return `<div class="print-block" style="${style};background:#e3f2fd;padding:16px"><div class="print-list-grid" style="grid-template-columns:repeat(${columns},1fr)">${items}</div></div>`;
      }
      default:
        return `<div class="print-block" style="${style};padding:16px"><pre>${this.escapeHtml(
          JSON.stringify(d, null, 2)
        )}</pre></div>`;
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private escapeAttr(value: unknown): string {
    return this.escapeHtml(value);
  }

  private escapeNumber(value: unknown, fallback: number): number {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  private escapeCssKeyword(value: unknown, fallback: string): string {
    const stringValue = String(value ?? fallback);
    return /^[a-z-]+$/i.test(stringValue) ? stringValue : fallback;
  }

  private escapeStyleColor(value: unknown, fallback: string): string {
    const stringValue = String(value ?? fallback);
    return /^#[0-9a-f]{3,8}$/i.test(stringValue) ? stringValue : fallback;
  }

  private onResizeMove(event: PointerEvent): void {
    if (!this.resizeState) return;
    const deltaX = event.clientX - this.resizeState.startClientX;
    const deltaY = event.clientY - this.resizeState.startClientY;
    const next = normalizeLayout(
      {
        ...this.resizeState.startLayout,
        w: this.resizeState.startLayout.w + Math.round(deltaX / getGridUnitX(this.page)),
        h: this.resizeState.startLayout.h + Math.round(deltaY / getGridUnitY(this.page)),
      },
      this.page
    );
    this.resizePreviewLayout.set(next);
    this.resizeCollisionBlockId.set(
      hasCollision(next, this.document.layout) ? this.resizeState.startLayout.blockId : null
    );
  }

  private finishResize(): void {
    window.removeEventListener('pointermove', this.boundResizeMove);
    window.removeEventListener('pointerup', this.boundResizeEnd);
    window.removeEventListener('pointercancel', this.boundResizeEnd);
    if (this.resizeState) {
      const nextLayout = this.resizePreviewLayout() ?? this.resizeState.startLayout;
      const index = this.document.layout.findIndex((layout) => layout.id === nextLayout.id);
      if (index !== -1) {
        if (hasCollision(nextLayout, this.document.layout)) {
          this.showCollisionFeedback(nextLayout.blockId);
        } else {
          this.commitMutation(() => {
            this.document.layout[index] = nextLayout;
          });
        }
      }
    }
    this.resizeState = null;
    this.resizePreviewLayout.set(null);
    this.resizeCollisionBlockId.set(null);
    this.resizingBlockId.set(null);
  }

  private getRenderedLayout(layout: LayoutBlock): LayoutBlock {
    const preview = this.resizePreviewLayout();
    return preview?.id === layout.id ? preview : layout;
  }

  private getDraggedLayout(layout: LayoutBlock, delta: { x: number; y: number }): LayoutBlock {
    const nextLeft = this.getLeftPx(layout) + delta.x;
    const nextTop = this.getTopPx(layout) + delta.y;
    return normalizeLayout(
      {
        ...layout,
        x: Math.round(nextLeft / getGridUnitX(this.page)),
        y: Math.round(nextTop / getGridUnitY(this.page)),
      },
      this.page
    );
  }

  private showCollisionFeedback(blockId: string): void {
    if (this.collisionTimer) clearTimeout(this.collisionTimer);
    this.collisionBlockId.set(blockId);
    this.collisionMessage.set('That move would overlap another block.');
    this.collisionTimer = setTimeout(() => this.clearCollisionFeedback(), 900);
  }

  private clearCollisionFeedback(): void {
    if (this.collisionTimer) {
      clearTimeout(this.collisionTimer);
      this.collisionTimer = null;
    }
    this.collisionBlockId.set(null);
    this.collisionMessage.set(null);
  }

  private getNudgeDirection(key: string): NudgeDirection | null {
    switch (key) {
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      default:
        return null;
    }
  }

  private commitMutation(mutator: () => void): void {
    const previous = structuredClone(this.document);
    mutator();

    this.pageSize = {
      widthPx: this.document.page.widthPx,
      heightPx: this.document.page.heightPx,
    };

    const previousSnapshot = this.snapshotDocument(previous);
    const nextSnapshot = this.snapshotDocument(this.document);
    if (previousSnapshot === nextSnapshot) return;

    this.history.push(previous);
    if (this.history.length > this.editorConfig.historyLimit) {
      this.history.shift();
    }
    this.future = [];
    this.lastSnapshot = nextSnapshot;
    this.syncHistoryFlags();
    this.documentChange.emit(structuredClone(this.document));
  }

  private snapshotDocument(document: PageDocument): string {
    return JSON.stringify(document);
  }

  private syncHistoryFlags(): void {
    this.canUndo.set(this.history.length > 0);
    this.canRedo.set(this.future.length > 0);
  }
}
