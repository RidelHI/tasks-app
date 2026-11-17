import { buildCorsOptions } from './cors.js';

describe('buildCorsOptions', () => {
  it('disables CORS when no origin is allowed', () => {
    expect(buildCorsOptions([])).toBeUndefined();
  });

  it('allows exactly the listed origins, the API methods and the headers clients need', () => {
    const options = buildCorsOptions(['https://app.example.com', 'http://localhost:4200']);

    expect(options).toEqual({
      origin: ['https://app.example.com', 'http://localhost:4200'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      exposedHeaders: ['Location', 'X-Request-Id'],
      maxAge: 600,
    });
  });
});
