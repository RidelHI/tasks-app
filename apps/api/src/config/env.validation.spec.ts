import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    const env = validateEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('converts numeric strings to numbers', () => {
    const env = validateEnv({ PORT: '8080' });

    expect(env.PORT).toBe(8080);
  });

  it.each(['abc', '', '0', '30.5', '70000'])('rejects PORT=%j', (port) => {
    expect(() => validateEnv({ PORT: port })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('accepts a known LOG_LEVEL', () => {
    expect(validateEnv({ LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => validateEnv({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses SWAGGER_ENABLED=%j as %s', (raw, expected) => {
    expect(validateEnv({ SWAGGER_ENABLED: raw }).SWAGGER_ENABLED).toBe(expected);
  });

  it.each(['yes', '1', 'TRUE', ''])('rejects SWAGGER_ENABLED=%j', (raw) => {
    expect(() => validateEnv({ SWAGGER_ENABLED: raw })).toThrow(/SWAGGER_ENABLED/);
  });

  it('reports every invalid variable in a single error', () => {
    const act = () => validateEnv({ NODE_ENV: 'staging', PORT: 'abc' });

    expect(act).toThrow(/NODE_ENV/);
    expect(act).toThrow(/PORT/);
  });

  it('does not echo variable values in the error message', () => {
    const act = () => validateEnv({ PORT: 's3cr3t-value' });

    expect(act).toThrow(/PORT/);
    expect(act).not.toThrow(/s3cr3t-value/);
  });
});
