import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_PAGE_SETTINGS,
  ContentBlock,
  createDefaultDocument,
  LayoutBlock,
  PageDocument,
  PageSettings,
  PageSize,
} from '@devandanger/page-layout-editor';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly data = signal<PageDocument>(structuredClone(createDefaultDocument()));
  readonly pageSize = signal<PageSize>({
    widthPx: DEFAULT_PAGE_SETTINGS.widthPx,
    heightPx: DEFAULT_PAGE_SETTINGS.heightPx,
  });

  reset(): void {
    const document = structuredClone(createDefaultDocument());
    this.setDocument(document);
  }

  update(newData: PageDocument): void {
    const document = structuredClone(newData);
    this.setDocument(document);
  }

  updateBlock(blockId: string, block: ContentBlock): void {
    const current = this.data();
    const blocks = current.blocks.map((currentBlock) =>
      currentBlock.id === blockId ? structuredClone(block) : currentBlock
    );
    this.setDocument({ ...current, blocks });
  }

  updateLayout(layoutId: string, patch: Partial<LayoutBlock>): void {
    const current = this.data();
    const layout = current.layout.map((item) =>
      item.id === layoutId ? { ...item, ...structuredClone(patch) } : item
    );
    this.setDocument({ ...current, layout });
  }

  updatePage(page: Partial<PageSettings>): void {
    const current = this.data();
    const nextPage = { ...current.page, ...page };
    this.setDocument({ ...current, page: nextPage });
  }

  getBlock(blockId: string): ContentBlock | undefined {
    return this.data().blocks.find((block) => block.id === blockId);
  }

  getLayoutByBlockId(blockId: string): LayoutBlock | undefined {
    return this.data().layout.find((item) => item.blockId === blockId);
  }

  updatePageSize(size: PageSize): void {
    this.updatePage(size);
  }

  private setDocument(document: PageDocument): void {
    this.data.set(document);
    this.pageSize.set({
      widthPx: document.page.widthPx,
      heightPx: document.page.heightPx,
    });
  }
}
