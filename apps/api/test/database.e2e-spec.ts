import { Client } from 'pg';

describe('E2E database (Testcontainers)', () => {
  it('provides a reachable PostgreSQL 18 through the DB_* variables', async () => {
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await client.connect();
    try {
      const { rows } = await client.query<{ server_version: string }>('SHOW server_version');

      expect(rows[0]?.server_version).toMatch(/^18\./);
    } finally {
      await client.end();
    }
  });
});
