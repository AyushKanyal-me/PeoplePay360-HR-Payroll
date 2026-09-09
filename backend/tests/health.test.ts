import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Check API', () => {
  it('GET /health should return 200 with status ok', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok'
      }
    });
  });

  it('GET /api/v1/health should return 200 with versioned status ok', async () => {
    const response = await request(app).get('/api/v1/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.version).toBe('v1');
    expect(response.body.data.timestamp).toBeDefined();
  });

  it('GET /api/v1/non-existent-route should return 404 with standard error envelope', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint was not found on this server'
      }
    });
  });
});
