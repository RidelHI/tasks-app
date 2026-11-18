import { Logger } from '@nestjs/common';
import dataSource from './data-source.js';
import { seedDemoTasks } from './seed/seed-demo-tasks.js';

/**
 * Loads the demo tasks into an empty database: `npm run db:seed` in development and the `seed`
 * service of compose.yaml. Like the migrations CLI it runs outside Nest, on the same data
 * source (local .env and the app's validation rules).
 */
const logger = new Logger('Seed');

await dataSource.initialize();
try {
  const inserted = await seedDemoTasks(dataSource);
  logger.log(
    inserted > 0
      ? `Inserted ${inserted} demo tasks`
      : 'The database already has tasks: no demo tasks inserted',
  );
} finally {
  await dataSource.destroy();
}
