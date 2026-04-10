import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ContentService } from '../../services/content.service';
import {
  DEFAULT_BLOCK_REGISTRY,
  PageDocument,
  PageLayoutEditor,
} from 'page-layout-editor';

@Component({
  selector: 'app-cdk-editor',
  imports: [PageLayoutEditor],
  templateUrl: './cdk-editor.html',
})
export class CdkEditor {
  private router = inject(Router);
  private contentService = inject(ContentService);

  document = this.contentService.data;
  registry = DEFAULT_BLOCK_REGISTRY;

  onDocumentChange(document: PageDocument): void {
    this.contentService.update(document);
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
