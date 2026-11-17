import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Decorator metadata polyfill (class-transformer, Nest DI). In the app it is
    // loaded by Nest itself; isolated unit tests need it explicitly.
    setupFiles: ['reflect-metadata'],
  },
});
