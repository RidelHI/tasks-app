import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { provideSvgIcons } from './svg-icons';

describe('provideSvgIcons', () => {
  let registry: MatIconRegistry;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideSvgIcons()],
    });
    registry = TestBed.inject(MatIconRegistry);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads an icon from the icons folder', async () => {
    const icon = firstValueFrom(registry.getNamedSvgIcon('checklist'));

    http
      .expectOne('icons/checklist.svg')
      .flush('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>');

    expect((await icon).tagName.toLowerCase()).toBe('svg');
  });

  it.each(['../secret', 'nested/icon', 'Checklist', 'icon.svg'])(
    'rejects %s, which is not a bare icon name',
    async (name) => {
      await expect(firstValueFrom(registry.getNamedSvgIcon(name))).rejects.toThrow(
        /Unable to find icon/,
      );
    },
  );

  it('rejects icons from a namespace', async () => {
    await expect(firstValueFrom(registry.getNamedSvgIcon('checklist', 'other'))).rejects.toThrow(
      /Unable to find icon/,
    );
  });
});
