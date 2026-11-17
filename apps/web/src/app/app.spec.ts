import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, MatIconTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('links the app name to the home page', () => {
    const brand = compiled.querySelector('header a.brand');

    expect(brand?.textContent?.trim()).toBe('Tasks');
    expect(brand?.getAttribute('href')).toBe('/');
  });

  it('shows the app icon, hidden from assistive technology', () => {
    const icon = compiled.querySelector('header mat-icon');

    expect(icon?.getAttribute('data-mat-icon-name')).toBe('checklist');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the routed page inside the main landmark', () => {
    expect(compiled.querySelector('main router-outlet')).not.toBeNull();
  });
});
