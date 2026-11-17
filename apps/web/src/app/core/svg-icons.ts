import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/** Folder, served from `public/`, that holds the app's SVG icons (Material Symbols, outlined). */
export const ICONS_PATH = 'icons';

/** An icon name is a bare file name, so it can never point outside the icons folder. */
const ICON_NAME = /^[a-z0-9_]+$/;

/**
 * Resolves `<mat-icon svgIcon="name">` to `icons/name.svg`: icons are self-hosted SVG files
 * instead of an icon font loaded from a third party.
 */
export function provideSvgIcons(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const sanitizer = inject(DomSanitizer);

    inject(MatIconRegistry).addSvgIconResolver((name, namespace) =>
      namespace === '' && ICON_NAME.test(name)
        ? sanitizer.bypassSecurityTrustResourceUrl(`${ICONS_PATH}/${name}.svg`)
        : null,
    );
  });
}
