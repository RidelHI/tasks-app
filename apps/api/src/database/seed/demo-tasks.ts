import type { Task } from '../../tasks/task.entity.js';
import type { TaskStatus } from '../../tasks/task-status.js';

/** A demo task, with its due date counted in days from the day the seed runs. */
interface DemoTask {
  title: string;
  status: TaskStatus;
  assignee: string | null;
  /** Negative is in the past (overdue unless done), 0 is today, `null` is no due date. */
  due: number | null;
  description?: string;
}

/** A row ready to insert: the database generates the id. */
export type DemoTaskRow = Omit<Task, 'id'>;

const ANA = 'Ana López';
const CARLOS = 'Carlos Méndez';
const DIEGO = 'Diego Ramírez';
const MATEO = 'Mateo Silva';
const SOFIA = 'Sofía Herrera';
const VALENTINA = 'Valentina Cruz';

/** Hours between the creation of one task and the next. */
const HOURS_BETWEEN_TASKS = 14;

/**
 * The demo content, newest first, as the list shows it: 48 tasks fill three pages of 20 (the
 * default page size), the last one partly. They cover every status, six assignees (names with
 * accents, to try the filter) and tasks without assignee, description or due date. Due dates
 * are relative, so some tasks are always overdue and one is due today.
 */
const DEMO_TASKS: readonly DemoTask[] = [
  { title: 'Plan the next sprint', status: 'pending', assignee: ANA, due: 6 },
  {
    title: 'Write the release notes for v1.4',
    status: 'pending',
    assignee: VALENTINA,
    due: 3,
    description: 'List the new filters, the fixes and the known issues.',
  },
  {
    title: 'Fix the date picker on Safari',
    status: 'in_progress',
    assignee: DIEGO,
    due: 2,
    description: 'The calendar opens behind the dialog on Safari 18.',
  },
  {
    title: 'Review the pull request for the CSV export',
    status: 'pending',
    assignee: CARLOS,
    due: 1,
  },
  { title: 'Update the onboarding guide', status: 'pending', assignee: null, due: null },
  {
    title: 'Add a search box to the task list',
    status: 'pending',
    assignee: SOFIA,
    due: 14,
    description: 'Search by title and description; agree on the design first.',
  },
  {
    title: 'Investigate the slow dashboard queries',
    status: 'in_progress',
    assignee: MATEO,
    due: 0,
    description: 'Some queries take over two seconds at peak hours.',
  },
  {
    title: 'Prepare the demo for the customer',
    status: 'in_progress',
    assignee: ANA,
    due: 1,
    description: 'Show the new filters and the pagination.',
  },
  { title: 'Rotate the staging database password', status: 'pending', assignee: MATEO, due: 5 },
  { title: 'Translate the settings page', status: 'pending', assignee: VALENTINA, due: null },
  { title: 'Set up error alerts for the API', status: 'in_progress', assignee: MATEO, due: 4 },
  { title: 'Design the empty state illustrations', status: 'done', assignee: SOFIA, due: -1 },
  { title: 'Remove the unused feature flags', status: 'pending', assignee: CARLOS, due: -2 },
  {
    title: 'Upgrade Node.js to the next LTS',
    status: 'pending',
    assignee: DIEGO,
    due: 21,
    description: 'Check that every dependency supports it first.',
  },
  {
    title: 'Interview candidates for the backend role',
    status: 'in_progress',
    assignee: ANA,
    due: 3,
  },
  { title: 'Document the deployment steps', status: 'done', assignee: DIEGO, due: -3 },
  { title: 'Fix the typo on the pricing page', status: 'done', assignee: VALENTINA, due: null },
  { title: 'Add keyboard shortcuts to the editor', status: 'pending', assignee: SOFIA, due: 30 },
  { title: 'Audit the color contrast of the app', status: 'in_progress', assignee: SOFIA, due: -1 },
  { title: 'Book a room for the quarterly planning', status: 'pending', assignee: null, due: 10 },
  { title: 'Clean up the old Docker images', status: 'done', assignee: MATEO, due: null },
  {
    title: 'Write tests for the invoice service',
    status: 'in_progress',
    assignee: CARLOS,
    due: -4,
    description: 'Cover the discounts and the rounding of the totals.',
  },
  { title: 'Measure the page load time on mobile', status: 'pending', assignee: DIEGO, due: 7 },
  {
    title: 'Reply to the security questionnaire',
    status: 'pending',
    assignee: ANA,
    due: -6,
    description: 'The customer needs it before signing the renewal.',
  },
  { title: 'Archive the 2025 project boards', status: 'done', assignee: null, due: null },
  { title: 'Add pagination to the audit log', status: 'done', assignee: CARLOS, due: -8 },
  {
    title: 'Move the cron jobs to the scheduler',
    status: 'in_progress',
    assignee: MATEO,
    due: 12,
    description: 'Start with the nightly reports; keep the old jobs until the new ones run.',
  },
  { title: 'Collect feedback from the beta users', status: 'done', assignee: VALENTINA, due: -10 },
  { title: 'Create the roadmap slides', status: 'done', assignee: ANA, due: -9 },
  { title: 'Fix the broken link in the footer', status: 'done', assignee: SOFIA, due: null },
  {
    title: 'Evaluate a feature flag service',
    status: 'pending',
    assignee: CARLOS,
    due: null,
    description: 'Compare the price and the SDKs of two or three options.',
  },
  { title: 'Back up the production database', status: 'done', assignee: MATEO, due: -12 },
  { title: 'Rename the reports module', status: 'pending', assignee: DIEGO, due: -7 },
  { title: 'Add dark mode screenshots to the docs', status: 'done', assignee: VALENTINA, due: -11 },
  { title: 'Set up the shared team calendar', status: 'done', assignee: null, due: null },
  {
    title: 'Reduce the size of the API image',
    status: 'done',
    assignee: DIEGO,
    due: -14,
    description: 'Leave out the development and optional dependencies.',
  },
  { title: 'Review the accessibility checklist', status: 'done', assignee: SOFIA, due: -13 },
  {
    title: 'Write the incident report for the outage',
    status: 'done',
    assignee: MATEO,
    due: -16,
    description: 'Timeline, root cause and the actions to prevent it.',
  },
  { title: 'Update the third-party licenses', status: 'pending', assignee: null, due: -9 },
  { title: 'Train the support team on the release', status: 'done', assignee: ANA, due: -15 },
  { title: 'Sketch the mobile layout of the list', status: 'done', assignee: SOFIA, due: -18 },
  { title: 'Configure the HTTPS certificates', status: 'done', assignee: DIEGO, due: -20 },
  {
    title: 'Choose the charting library',
    status: 'done',
    assignee: CARLOS,
    due: -19,
    description: 'It must work offline and support dark mode.',
  },
  { title: 'Define the API error format', status: 'done', assignee: CARLOS, due: -22 },
  { title: 'Create the project repository', status: 'done', assignee: DIEGO, due: null },
  { title: 'Agree on the coding conventions', status: 'done', assignee: ANA, due: -24 },
  {
    title: 'Write the product requirements',
    status: 'done',
    assignee: VALENTINA,
    due: -25,
    description: 'Tasks with a status, an assignee and a due date, filtered and paginated.',
  },
  { title: 'Kick off the project', status: 'done', assignee: ANA, due: -27 },
];

/**
 * The demo tasks as rows, dated from `now`: the first one was created 14 hours before, each
 * following one 14 hours earlier (the oldest four weeks before), and due dates count from the
 * local calendar day of `now`.
 */
export function buildDemoTasks(now: Date): DemoTaskRow[] {
  return DEMO_TASKS.map((task, index) => {
    const createdAt = new Date(now.getTime() - (index + 1) * HOURS_BETWEEN_TASKS * 3_600_000);
    return {
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      assignee: task.assignee,
      dueDate: task.due === null ? null : calendarDate(now, task.due),
      createdAt,
      updatedAt: createdAt,
    };
  });
}

/** The local calendar day `days` after `from`, as `YYYY-MM-DD`. */
function calendarDate(from: Date, days: number): string {
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  const month = String(day.getMonth() + 1).padStart(2, '0');
  return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, '0')}`;
}
