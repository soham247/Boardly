import request from 'supertest';
import { app } from '../app.js';

describe('Health Check', () => {
  test('GET /api/v1/health returns 200 with status OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'OK', message: 'Health check passed' });
  });

  test('basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });
});
