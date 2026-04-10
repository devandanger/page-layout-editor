import { Component, input, output } from '@angular/core';
import { PageSize } from '../../models/content-block.model';

@Component({
  selector: 'app-editor-menu',
  templateUrl: './editor-menu.html',
  styleUrl: './editor-menu.scss',
})
export class EditorMenu {
  title = input.required<string>();
  accent = input<string>('#1e1e1e');
  pageSize = input.required<PageSize>();
  hint = input<string>('');
  canUndo = input(false);
  canRedo = input(false);

  back = output<void>();
  printPreview = output<void>();
  undo = output<void>();
  redo = output<void>();

  fileMenuOpen = false;

  toggleFileMenu(): void {
    this.fileMenuOpen = !this.fileMenuOpen;
  }

  closeMenus(): void {
    this.fileMenuOpen = false;
  }

  onBack(): void {
    this.closeMenus();
    this.back.emit();
  }

  onPrintPreview(): void {
    this.closeMenus();
    this.printPreview.emit();
  }

  onUndo(): void {
    this.closeMenus();
    this.undo.emit();
  }

  onRedo(): void {
    this.closeMenus();
    this.redo.emit();
  }
}
