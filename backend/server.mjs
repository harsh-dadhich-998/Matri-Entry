import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createApiRouter } from './server/api.mjs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: false });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend environment.',
  );
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;

if (production) {
  if (frontendUrl) {
    try {
      const parsed = new URL(frontendUrl);
      if (parsed.protocol !== 'https:') {
        console.warn('Warning: FRONTEND_URL should use HTTPS in production.');
      }
    } catch {
      console.warn('Warning: Unable to parse FRONTEND_URL.');
    }
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error(
      'Configure RESEND_API_KEY and RESEND_FROM_EMAIL before starting production.',
    );
  }
}

app.disable('x-powered-by');
app.set('trust proxy', production ? 1 : false);

// Allowed origins for CORS
const allowedOrigins = [
  frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
]
  .filter(Boolean)
  .map((u) => u.replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  }),
);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': req.path.startsWith('/api/') ? 'no-store' : 'no-cache',
  });
  next();
});

app.use(express.json({ limit: '1mb' }));

// Health and verification endpoint for cloud hosting
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'MatriEntry API',
    production,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', createApiRouter({ db, env: process.env, production }));

app.use('/api', (_req, res) =>
  res.status(404).json({ error: 'API route not found.' }),
);

app.use('/api', (error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid JSON request body.' });
  if (error?.type === 'entity.too.large')
    return res.status(413).json({ error: 'Request body is too large.' });
  console.error('API request failed:', error?.message || 'unknown error');
  res
    .status(500)
    .json({ error: 'The request could not be completed. Please try again.' });
});

const server = app.listen(port, () =>
  console.log(`MatriEntry Backend API listening on port ${port}`),
);

const close = () => server.close(() => process.exit(0));
process.once('SIGINT', close);
process.once('SIGTERM', close);
