import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BlockRendererRegistry, PageDocument, PageLayoutEditor } from 'page-layout-editor';
import { ContentService } from '../../services/content.service';
import {
  DEMO_BLOCK_REGISTRY,
  printDemoCalloutRenderer,
  printDemoQuestionsRenderer,
} from '../../demo-block-registry';
import { DemoCalloutRendererComponent } from '../../demo-callout-renderer';
import { DemoQuestionsRendererComponent } from '../../demo-questions-renderer';

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
  renderers: BlockRendererRegistry = {
    'callout-card': {
      component: DemoCalloutRendererComponent,
      printAdapter: printDemoCalloutRenderer,
    },
    'list-grid': {
      component: DemoQuestionsRendererComponent,
      printAdapter: printDemoQuestionsRenderer,
    },
  };

  onDocumentChange(document: PageDocument): void {
    this.contentService.update(document);
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
