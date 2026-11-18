import type { DataSource } from 'typeorm';
import { Task } from '../../tasks/task.entity.js';
import { buildDemoTasks } from './demo-tasks.js';

/**
 * Inserts the demo tasks if the table is empty and returns how many it inserted: 0 when there
 * are tasks already, so running it again never duplicates them nor touches tasks people created.
 */
export async function seedDemoTasks(dataSource: DataSource, now = new Date()): Promise<number> {
  return dataSource.transaction(async (manager) => {
    // Holds back other writers until the commit, so the check and the insert are one step.
    await manager.query('LOCK TABLE tasks IN EXCLUSIVE MODE');
    if (await manager.exists(Task)) {
      return 0;
    }

    const tasks = buildDemoTasks(now);
    await manager.insert(Task, tasks);
    return tasks.length;
  });
}
