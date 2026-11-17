import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [MatButton, RouterLink],
  template: `
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <a matButton="filled" routerLink="/tasks">Go to tasks</a>
  `,
})
export class NotFoundPage {}
