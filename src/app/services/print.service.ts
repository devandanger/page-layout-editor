import { Injectable } from '@angular/core';
import { PageSize } from '../page-layout-editor/document-api';

@Injectable({ providedIn: 'root' })
export class PrintService {
  /**
   * Opens a print-preview window with the given HTML + CSS content,
   * sized to the page dimensions.
   */
  openPrintPreview(
    contentHtml: string,
    contentCss: string,
    pageSize: PageSize
  ): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print Preview</title>
  <style>
    @page {
      size: ${pageSize.widthPx}px ${pageSize.heightPx}px;
      margin: 0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #e0e0e0;
      color: #333;
    }

    /* Top bar — hidden when printing */
    .preview-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e1e1e;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.6rem 1.5rem;
      font-size: 0.9rem;
    }

    .preview-bar button {
      padding: 0.4rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-print {
      background: #4caf50;
      color: #fff;
    }
    .btn-print:hover { background: #388e3c; }

    .btn-close {
      background: #444;
      color: #fff;
      margin-left: auto;
    }
    .btn-close:hover { background: #555; }

    .preview-bar .dims {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      color: #aaa;
    }

    /* Page container */
    .page {
      width: ${pageSize.widthPx}px;
      min-height: ${pageSize.heightPx}px;
      margin: 2rem auto;
      background: #fff;
      box-shadow: 0 2px 16px rgba(0,0,0,0.2);
      overflow: hidden;
    }

    @media print {
      .preview-bar { display: none; }
      body { background: #fff; }
      .page {
        margin: 0;
        box-shadow: none;
        width: 100%;
        min-height: auto;
      }
    }

    /* Content styles */
    ${contentCss}
  </style>
</head>
<body>
  <div class="preview-bar">
    <span>Print Preview</span>
    <span class="dims">${pageSize.widthPx} &times; ${pageSize.heightPx}px</span>
    <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>
  <div class="page">
    ${contentHtml}
  </div>
</body>
</html>`);
    printWindow.document.close();
  }
}
