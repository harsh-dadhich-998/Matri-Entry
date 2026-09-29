import dotenv from 'dotenv';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../server/security.mjs';
import { credentialsEmail } from '../server/email.mjs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: false });

const readArg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : '';
};
const name = readArg('name').trim();
const email = readArg('email').trim().toLowerCase();
const username = readArg('username').trim().toLowerCase();
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.FRONTEND_URL || process.env.APP_URL)?.replace(/\/$/, '');

if (
  !name ||
  name.length > 100 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !/^[a-z0-9_]{3,40}$/.test(username)
) {
  throw new Error(
    'Usage: npm run admin:bootstrap -- --name "Admin name" --email admin@example.com --username admin_name',
  );
}
if (
  !url ||
  !serviceKey ||
  !appUrl ||
  !process.env.RESEND_API_KEY ||
  !process.env.RESEND_FROM_EMAIL
) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL (or APP_URL), RESEND_API_KEY, and RESEND_FROM_EMAIL in .env.',
  );
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: existing, error: lookupError } = await db
  .from('users')
  .select('id,name,username,email,role,status')
  .ilike('email', email)
  .maybeSingle();
if (lookupError)
  throw new Error(
    'Unable to check for an existing account. Apply the custom-auth database migration first.',
  );
if (existing && (existing.role !== 'admin' || existing.status !== 'active'))
  throw new Error(
    'That email belongs to a non-admin or inactive account; no changes were made.',
  );
if (!existing) {
  const { data: admin, error } = await db
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Unable to check existing administrators.');
  if (admin)
    throw new Error(
      'An administrator already exists. Specify that administrator email to reset its custom password.',
    );
}

const password = `Aa9!${randomBytes(24).toString('base64url')}`;
const user = existing || {
  id: randomUUID(),
  name,
  username,
  email,
  role: 'admin',
  status: 'active',
};
const update = {
  name,
  username,
  email,
  password_hash: await hashPassword(password),
  must_change_password: true,
  password_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
const result = existing
  ? await db.from('users').update(update).eq('id', user.id)
  : await db.from('users').insert({
      ...user,
      ...update,
      assigned_records: 0,
      completed_records: 0,
      pending_records: 0,
    });
if (result.error)
  throw new Error(
    'Unable to save the administrator profile.' + JSON.stringify(result.error),
  );
await db.from('app_sessions').delete().eq('user_id', user.id);

const message = {
  from: process.env.RESEND_FROM_EMAIL,
  to: [email],
  ...credentialsEmail({ name, username, email }, password, appUrl),
};
let delivered = false;
try {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(10000),
  });
  await response.body?.cancel();
  delivered = response.ok;
} catch {
  /* The account remains recoverable by rerunning this command. */
}
if (!delivered)
  throw new Error(
    'Admin account password was reset, but Resend did not accept the email. Check Resend, then rerun this command to issue fresh credentials.',
  );
console.log(
  `Admin credentials were sent to ${email}. The temporary password expires in 24 hours.`,
);
