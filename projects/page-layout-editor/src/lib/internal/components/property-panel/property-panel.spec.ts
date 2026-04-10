import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { PropertyPanel } from './property-panel';
import { ContentBlock, LayoutBlock } from '../../models/content-block.model';
import { TEXT_SCHEMA } from '../../models/block-schemas';

const block: ContentBlock = {
  id: 'block-1',
  blockType: 'text',
  schema: TEXT_SCHEMA,
  data: {
    content: 'Original text',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'left',
    backgroundColor: '#ffffff',
  },
};

const layout: LayoutBlock = {
  id: 'layout-1',
  blockId: 'block-1',
  x: 1,
  y: 2,
  w: 5,
  h: 4,
  locked: false,
  hidden: false,
  zIndex: 1,
};

describe('PropertyPanel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPanel],
    }).compileComponents();
  });

  it('renders the empty state when no block is selected', () => {
    const fixture = TestBed.createComponent(PropertyPanel);
    fixture.componentRef.setInput('block', null);
    fixture.componentRef.setInput('layout', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-panel')).not.toBeNull();
  });

  it('emits content changes for block properties', () => {
    const fixture = TestBed.createComponent(PropertyPanel);
    fixture.componentRef.setInput('block', block);
    fixture.componentRef.setInput('layout', layout);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.blockChange, 'emit');
    fixture.componentInstance.onPropChange('content', 'Updated text');

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'block-1',
        data: expect.objectContaining({ content: 'Updated text' }),
      })
    );
  });

  it('emits layout changes for layout properties', () => {
    const fixture = TestBed.createComponent(PropertyPanel);
    fixture.componentRef.setInput('block', block);
    fixture.componentRef.setInput('layout', layout);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.layoutChange, 'emit');
    const xProp = fixture.componentInstance.layoutProps.find((prop) => prop.key === 'x');
    expect(xProp).toBeDefined();

    fixture.componentInstance.onLayoutPropChange(xProp!, 7);

    expect(emitSpy).toHaveBeenCalledWith({ x: 7 });
  });

  it('emits lifecycle and layout action intents from the action buttons', () => {
    const fixture = TestBed.createComponent(PropertyPanel);
    fixture.componentRef.setInput('block', block);
    fixture.componentRef.setInput('layout', layout);
    fixture.detectChanges();

    const duplicateSpy = vi.spyOn(fixture.componentInstance.duplicate, 'emit');
    const removeSpy = vi.spyOn(fixture.componentInstance.remove, 'emit');

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.layout-actions .action-btn')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Duplicate'))?.click();
    buttons.find((button) => button.textContent?.includes('Delete'))?.click();

    expect(duplicateSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
