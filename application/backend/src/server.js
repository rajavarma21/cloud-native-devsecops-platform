const express = require('express');
const helmet = require('helmet');
const { createClient } = require('redis');

const app = express();
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = createClient({ url: redisUrl });
redis.on('error', (error) => {
  console.error('Redis client error:', error.message);
});

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'cloud-native-devsecops-platform',
    status: 'ok',
    message: 'CloudForge API is running',
  });
});

// Liveness: checks that the API process can respond.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
    timestamp: new Date().toISOString(),
  });
});

// Readiness: checks whether the API can use Redis.
app.get('/health/ready', async (_req, res) => {
  try {
    if (!redis.isReady) {
      return res.status(503).json({
        status: 'not_ready',
        dependency: 'redis',
      });
    }

    await redis.ping();

    return res.status(200).json({
      status: 'ready',
      service: 'backend-api',
      dependencies: { redis: 'connected' },
    });
  } catch (_error) {
    return res.status(503).json({
      status: 'not_ready',
      dependency: 'redis',
    });
  }
});

// Redis-backed counter.
app.post('/api/counter/increment', async (_req, res) => {
  try {
    if (!redis.isReady) {
      return res.status(503).json({ error: 'Redis unavailable' });
    }

    const count = await redis.incr('cloudforge:counter');
    return res.status(200).json({ count });
  } catch (_error) {
    return res.status(503).json({ error: 'Redis unavailable' });
  }
});

let server;

async function start() {
  await redis.connect();

  const port = Number(process.env.PORT) || 5000;

  server = app.listen(port, '0.0.0.0', () => {
    console.log(`CloudForge API listening on port ${port}`);
  });
}

async function stop() {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (redis.isOpen) {
    await redis.quit();
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start CloudForge API:', error.message);
    process.exitCode = 1;
  });

  process.on('SIGINT', () => {
    stop().finally(() => process.exit());
  });

  process.on('SIGTERM', () => {
    stop().finally(() => process.exit());
  });
}

module.exports = { app, redis };
