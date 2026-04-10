import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ContentService } from '../../services/content.service';
import { PageDocument, PageLayoutEditor } from 'page-layout-editor';
import { DEMO_BLOCK_REGISTRY } from '../../demo-block-registry';

@Component({
  selector: 'app-cdk-editor',
  imports: [PageLayoutEditor],
  templateUrl: './cdk-editor.html',
})
export class CdkEditor {
  private router = inject(Router);
  private contentService = inject(ContentService);

  document = this.contentService.data;
  registry = DEMO_BLOCK_REGISTRY;

  onDocumentChange(document: PageDocument): void {
    this.contentService.update(document);
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
