import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    const env = validateEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
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
