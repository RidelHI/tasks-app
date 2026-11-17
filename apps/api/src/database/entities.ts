/**
 * Every TypeORM entity of the app. An explicit registry (instead of file globs or Nest's
 * autoLoadEntities) works the same in Nest, the TypeORM CLI and the test runner.
 */
export const ENTITIES: Array<new (...args: never[]) => object> = [];
