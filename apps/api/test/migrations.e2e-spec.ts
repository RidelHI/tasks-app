import { DataSource, QueryFailedError } from 'typeorm';
import { inject } from 'vitest';
import { buildDataSourceOptions } from '../src/database/data-source-options.js';
import { MIGRATIONS } from '../src/database/migrations/index.js';
import { Task } from '../src/tasks/task.entity.js';
import { UUID_V7 } from './utils/uuid.js';

/** PostgreSQL error codes (SQLSTATE) the schema must raise. */
const CHECK_VIOLATION = '23514';
const NOT_NULL_VIOLATION = '23502';

interface ColumnInfo {
  name: string;
  type: string;
  maxLength: number | null;
  nullable: 'YES' | 'NO';
  default: string | null;
}

describe('Database schema and migrations (e2e)', () => {
  let dataSource: DataSource;

  const tableExists = async (table: string): Promise<boolean> => {
    const [row] = await dataSource.query<{ exists: boolean }[]>(
      'SELECT to_regclass($1) IS NOT NULL AS exists',
      [`public.${table}`],
    );
    return row?.exists ?? false;
  };

  beforeAll(async () => {
    dataSource = new DataSource(buildDataSourceOptions(inject('database'), false));
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('creates the tasks table with snake_case columns, types and defaults', async () => {
    const columns = await dataSource.query<ColumnInfo[]>(
      `SELECT column_name AS name, data_type AS type, character_maximum_length AS "maxLength",
              is_nullable AS nullable, column_default AS default
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks'
        ORDER BY ordinal_position`,
    );

    expect(columns).toEqual([
      { name: 'id', type: 'uuid', maxLength: null, nullable: 'NO', default: 'uuidv7()' },
      { name: 'title', type: 'character varying', maxLength: 200, nullable: 'NO', default: null },
      {
        name: 'description',
        type: 'character varying',
        maxLength: 2000,
        nullable: 'YES',
        default: null,
      },
      {
        name: 'status',
        type: 'character varying',
        maxLength: 20,
        nullable: 'NO',
        default: "'pending'::character varying",
      },
      {
        name: 'assignee',
        type: 'character varying',
        maxLength: 100,
        nullable: 'YES',
        default: null,
      },
      { name: 'due_date', type: 'date', maxLength: null, nullable: 'YES', default: null },
      {
        name: 'created_at',
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: 'NO',
        default: 'now()',
      },
      {
        name: 'updated_at',
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: 'NO',
        default: 'now()',
      },
    ]);
  });

  it('keeps the migrations in sync with the entities', async () => {
    const pending = await dataSource.driver.createSchemaBuilder().log();

    expect(pending.upQueries.map((query) => query.query)).toEqual([]);
  });

  it('creates the indexes of the list queries', async () => {
    const indexes = await dataSource.query<{ name: string; definition: string }[]>(
      `SELECT indexname AS name, indexdef AS definition
         FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'tasks'
        ORDER BY indexname`,
    );

    expect(indexes.map((index) => index.name)).toEqual([
      'IDX_tasks_assignee_created_at',
      'IDX_tasks_created_at',
      'IDX_tasks_status_created_at',
      'PK_tasks',
    ]);
    expect(indexes[0]?.definition).toContain('(lower((assignee)::text), created_at, id)');
  });

  it.each([
    ['IDX_tasks_created_at', ''],
    ['IDX_tasks_status_created_at', "WHERE status = 'pending'"],
    ['IDX_tasks_assignee_created_at', "WHERE lower(assignee) = lower('Jane Doe')"],
  ])('serves a page of the list from %s, without sorting', async (index, filter) => {
    const plan = await dataSource.transaction(async (manager) => {
      // A sequential scan is cheaper on a tiny test table: rule it out to see the index.
      await manager.query('SET LOCAL enable_seqscan = off');
      const rows = await manager.query<{ 'QUERY PLAN': string }[]>(
        `EXPLAIN SELECT * FROM tasks ${filter} ORDER BY created_at DESC, id DESC LIMIT 20`,
      );
      return rows.map((row) => row['QUERY PLAN']).join('\n');
    });

    expect(plan).toContain(`Index Scan Backward using "${index}"`);
    expect(plan).not.toMatch(/\bSort\b/);
  });

  it('reverts every migration and applies them again', async () => {
    for (const _ of MIGRATIONS) {
      await dataSource.undoLastMigration();
    }
    expect(await tableExists('tasks')).toBe(false);

    const applied = await dataSource.runMigrations();

    expect(applied).toHaveLength(MIGRATIONS.length);
    expect(await tableExists('tasks')).toBe(true);
  });

  it('generates a UUIDv7 id and the default status', async () => {
    const [row] = await dataSource.query<{ id: string; status: string }[]>(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING id, status',
      ['Write the README'],
    );

    expect(row?.id).toMatch(UUID_V7);
    expect(row?.status).toBe('pending');
  });

  it('rejects a status outside the allowed values', async () => {
    const insert = dataSource.query('INSERT INTO tasks (title, status) VALUES ($1, $2)', [
      'Write the README',
      'archived',
    ]);

    await expect(insert).rejects.toBeInstanceOf(QueryFailedError);
    await expect(insert).rejects.toMatchObject({
      code: CHECK_VIOLATION,
      constraint: 'CHK_tasks_status',
    });
  });

  it('rejects a task without title', async () => {
    const insert = dataSource.query('INSERT INTO tasks (title) VALUES (NULL)');

    await expect(insert).rejects.toMatchObject({ code: NOT_NULL_VIOLATION, column: 'title' });
  });

  it('maps a task through the repository, keeping the due date as a calendar date', async () => {
    const repository = dataSource.getRepository(Task);

    const saved = await repository.save(
      repository.create({ title: 'Ship v1', assignee: 'Jane', dueDate: '2026-12-01' }),
    );
    const found = await repository.findOneByOrFail({ id: saved.id });

    expect(found).toEqual({
      id: expect.stringMatching(UUID_V7),
      title: 'Ship v1',
      description: null,
      status: 'pending',
      assignee: 'Jane',
      dueDate: '2026-12-01',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
