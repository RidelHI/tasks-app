import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  const heading = () => harness.routeNativeElement?.querySelector('h1')?.textContent;

  it('opens the task list by default', async () => {
    await harness.navigateByUrl('/');

    expect(TestBed.inject(Title).getTitle()).toBe('Tasks');
    expect(heading()).toBe('Tasks');
  });

  it('shows a not found page for an unknown url', async () => {
    await harness.navigateByUrl('/does-not-exist');

    expect(TestBed.inject(Title).getTitle()).toBe('Page not found · Tasks');
    expect(heading()).toBe('Page not found');
  });
});
