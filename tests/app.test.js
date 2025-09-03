const request = require('supertest');
const app = require('../app');

describe('Assetrix Demo App', () => {
  describe('GET /', () => {
    it('should return hello world message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Hello World from Assetrix DevOps Demo');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/version', () => {
    it('should return version information', async () => {
      const response = await request(app).get('/api/version');
      expect(response.status).toBe(200);
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.name).toBe('assetrix-demo-app');
    });
  });
});
