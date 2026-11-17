import { API_PREFIX } from '../app.constants.js';

export const HEALTH_PATH = 'health';

/** Health checks are not versioned: `/api/health/live` and `/api/health/ready`. */
export const HEALTH_URL_PREFIX = `/${API_PREFIX}/${HEALTH_PATH}/`;
