import { Component, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ContentBlock,
  LAYOUT_PROPERTIES,
  LayoutBlock,
  LayoutPropDef,
  PropDef,
} from '../../models/content-block.model';

@Component({
  selector: 'app-property-panel',
  imports: [FormsModule],
  templateUrl: './property-panel.html',
  styleUrl: './property-panel.scss',
})
export class PropertyPanel {
  block = input.required<ContentBlock | null>();
  layout = input<LayoutBlock | null>(null);
  blockChange = output<ContentBlock>();
  layoutChange = output<Partial<LayoutBlock>>();
  duplicate = output<void>();
  remove = output<void>();
  toggleHidden = output<void>();
  toggleLocked = output<void>();
  bringForward = output<void>();
  sendBackward = output<void>();
  closed = output<void>();

  schema = computed(() => this.block()?.schema ?? null);
  data = computed(() => this.block()?.data ?? null);
  layoutProps = LAYOUT_PROPERTIES;

  // --- Generic property change ---
  onPropChange(key: string, value: any): void {
    const b = this.block();
    if (!b) return;
    this.blockChange.emit({
      ...b,
      data: { ...b.data, [key]: value },
    });
  }

  // --- Array operations ---
  onArrayItemChange(arrayKey: string, index: number, itemKey: string, value: any): void {
    const b = this.block();
    if (!b) return;
    const arr = [...(b.data[arrayKey] as any[])];
    arr[index] = { ...arr[index], [itemKey]: value };
    this.blockChange.emit({
      ...b,
      data: { ...b.data, [arrayKey]: arr },
    });
  }

  addArrayItem(arrayKey: string, prop: PropDef): void {
    const b = this.block();
    if (!b) return;
    const arr = [...(b.data[arrayKey] as any[])];
    arr.push(structuredClone(prop.itemDefault ?? {}));
    this.blockChange.emit({
      ...b,
      data: { ...b.data, [arrayKey]: arr },
    });
  }

  removeArrayItem(arrayKey: string, index: number): void {
    const b = this.block();
    if (!b) return;
    const arr = (b.data[arrayKey] as any[]).filter((_, i) => i !== index);
    this.blockChange.emit({
      ...b,
      data: { ...b.data, [arrayKey]: arr },
    });
  }

  getArrayItems(key: string): any[] {
    return (this.data()?.[key] as any[]) ?? [];
  }

  getTextLength(value: unknown): number {
    return String(value ?? '').length;
  }

  onLayoutPropChange(prop: LayoutPropDef, value: any): void {
    if (!this.layout()) return;
    const nextValue = prop.type === 'number' ? Math.max(prop.min ?? 0, Number(value)) : value;
    this.layoutChange.emit({ [prop.key]: nextValue } as Partial<LayoutBlock>);
  }

  isImageUrl(value: unknown): boolean {
    if (!value) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|avif)|picsum|unsplash|placeholder/i.test(
      String(value)
    );
  }
}
