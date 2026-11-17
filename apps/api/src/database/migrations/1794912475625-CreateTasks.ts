import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasks1794912475625 implements MigrationInterface {
  name = 'CreateTasks1794912475625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tasks" (
                "id" uuid NOT NULL DEFAULT uuidv7(),
                "title" character varying(200) NOT NULL,
                "description" character varying(2000),
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "assignee" character varying(100),
                "due_date" date,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "CHK_tasks_status" CHECK ("status" IN ('pending', 'in_progress', 'done')),
                CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "tasks"
        `);
  }
}
