import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    title: 'Tasks',
    loadComponent: () => import('./tasks/tasks-page').then((m) => m.TasksPage),
  },
  {
    path: '**',
    title: 'Page not found · Tasks',
    loadComponent: () => import('./not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
