
const express = require('express');
const helmet = require('helmet');
const { createClient } = require('redis');
const cors = require('cors');
const client = require('@prometheus-io/client');
const app = express();
// Collect default Node.js metrics
client.collectDefaultMetrics();

// Total HTTP requests
const httpRequestsTotal = new client.Counter({
  name: 'cloudforge_http_requests_total',
  help: 'Total HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
});

// HTTP request duration
const httpRequestDuration = new client.Histogram({
  name: 'cloudforge_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
const PORT = Number(process.env.PORT) || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'http://localhost:5174';

const redis = createClient({ url: REDIS_URL });

let server;

redis.on('error', (error) => {
  console.error('Redis client error:', error.message);
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
// HTTP request monitoring middleware
app.use((req, res, next) => {
  // Avoid monitoring Prometheus scrape requests
  if (req.path === '/metrics') {
    return next();
  }

  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const duration =
      Number(process.hrtime.bigint() - startTime) / 1e9;

    // Read the matched Express route after request processing
    const route = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : 'unmatched';

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    console.error('Failed to generate metrics:', error.message);
    res.status(500).end('Unable to generate metrics');
  }
});
app.get('/', (_req, res) => {
  res.json({
    service: 'cloud-native-devsecops-platform',
    status: 'ok',
    message: 'CloudForge API is running',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
    timestamp: new Date().toISOString(),
  });
});

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

async function start() {
  await redis.connect();

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudForge API listening on port ${PORT}`);
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
