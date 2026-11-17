import { validateEnv } from './env.validation.js';

/** The minimum valid environment: the database credentials have no defaults. */
const required = { DB_USERNAME: 'tasks', DB_PASSWORD: 'tasks', DB_NAME: 'tasks' };

describe('validateEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    const env = validateEnv(required);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(5432);
  });

  it('converts numeric strings to numbers', () => {
    const env = validateEnv({ ...required, PORT: '8080', DB_PORT: '6543' });

    expect(env.PORT).toBe(8080);
    expect(env.DB_PORT).toBe(6543);
  });

  it.each(['abc', '', '0', '30.5', '70000'])('rejects PORT=%j', (port) => {
    expect(() => validateEnv({ ...required, PORT: port })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...required, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('accepts a known LOG_LEVEL', () => {
    expect(validateEnv({ ...required, LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => validateEnv({ ...required, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses SWAGGER_ENABLED=%j as %s', (raw, expected) => {
    expect(validateEnv({ ...required, SWAGGER_ENABLED: raw }).SWAGGER_ENABLED).toBe(expected);
  });

  it.each(['yes', '1', 'TRUE', ''])('rejects SWAGGER_ENABLED=%j', (raw) => {
    expect(() => validateEnv({ ...required, SWAGGER_ENABLED: raw })).toThrow(/SWAGGER_ENABLED/);
  });

  it('requires the database credentials', () => {
    const act = () => validateEnv({});

    expect(act).toThrow(/DB_USERNAME/);
    expect(act).toThrow(/DB_PASSWORD/);
    expect(act).toThrow(/DB_NAME/);
  });

  it.each(['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'])('rejects an empty %s', (name) => {
    expect(() => validateEnv({ ...required, [name]: '' })).toThrow(new RegExp(name));
  });

  it('rejects a non-numeric DB_PORT', () => {
    expect(() => validateEnv({ ...required, DB_PORT: 'abc' })).toThrow(/DB_PORT/);
  });

  it('reports every invalid variable in a single error', () => {
    const act = () => validateEnv({ ...required, NODE_ENV: 'staging', PORT: 'abc' });

    expect(act).toThrow(/NODE_ENV/);
    expect(act).toThrow(/PORT/);
  });

  it('does not echo variable values in the error message', () => {
    const act = () =>
      validateEnv({ ...required, DB_PASSWORD: 'p4ssw0rd-secret', PORT: 's3cr3t-value' });

    expect(act).toThrow(/PORT/);
    expect(act).not.toThrow(/s3cr3t-value/);
    expect(act).not.toThrow(/p4ssw0rd-secret/);
  });
});
