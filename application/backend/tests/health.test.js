const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app, redis } = require('../src/server');

test.before(async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
});

test.after(async () => {
  if (redis.isOpen) {
    await redis.quit();
  }
});

test('GET /health returns a healthy status', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'healthy');
  assert.equal(response.body.service, 'backend-api');
  assert.ok(response.body.timestamp);
});

test('GET / does not expose the Express header', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('GET /health/ready confirms Redis connectivity', async () => {
  const response = await request(app).get('/health/ready');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ready');
  assert.equal(response.body.dependencies.redis, 'connected');
});

test('POST /api/counter/increment increases the Redis counter', async () => {
  const first = await request(app).post('/api/counter/increment');
  const second = await request(app).post('/api/counter/increment');

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.count, first.body.count + 1);
});
