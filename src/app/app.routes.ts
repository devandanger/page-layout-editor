import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./pages/cdk-editor/cdk-editor').then((m) => m.CdkEditor),
  },
];
