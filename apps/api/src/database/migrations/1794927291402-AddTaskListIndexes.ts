import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskListIndexes1794927291402 implements MigrationInterface {
  name = 'AddTaskListIndexes1794927291402';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "IDX_tasks_status_created_at" ON "tasks" ("status", "created_at", "id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_tasks_created_at" ON "tasks" ("created_at", "id")
        `);
    // Written by hand: the assignee filter compares lower(assignee), which TypeORM cannot
    // generate. The entity declares it with `synchronize: false`.
    await queryRunner.query(`
            CREATE INDEX "IDX_tasks_assignee_created_at" ON "tasks" (lower("assignee"), "created_at", "id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_tasks_assignee_created_at"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_tasks_created_at"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_tasks_status_created_at"
        `);
  }
}
