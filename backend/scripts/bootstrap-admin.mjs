import dotenv from 'dotenv';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../server/security.mjs';
import { credentialsEmail } from '../server/email.mjs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: false });

const readArg = (name, fallbackPos) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefix = `--${name}=`;
  const matched = process.argv.find((arg) => arg.startsWith(prefix));
  if (matched) return matched.slice(prefix.length);
  if (fallbackPos !== undefined && process.argv[fallbackPos]) return process.argv[fallbackPos];
  return '';
};
const name = readArg('name', 2).trim();
const email = readArg('email', 3).trim().toLowerCase();
const username = readArg('username', 4).trim().toLowerCase();
const password = readArg('password', 5);
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.FRONTEND_URL || process.env.APP_URL)?.replace(/\/$/, '');

if (
  !name ||
  name.length > 100 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !/^[a-z0-9_]{3,40}$/.test(username) ||
  !password ||
  password.length < 8
) {
  throw new Error(
    'Usage: npm run admin:bootstrap -- --name "Admin name" --email admin@example.com --username admin_name --password "Your8+CharPassword"',
  );
}
if (!url || !serviceKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.');
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existingByEmail, error: lookupEmailError } = await db
  .from('users')
  .select('id,name,username,email,role,status')
  .ilike('email', email)
  .maybeSingle();

if (lookupEmailError) {
  throw new Error(
    'Unable to check for an existing account: ' + JSON.stringify(lookupEmailError),
  );
}

const { data: existingByUsername, error: lookupUsernameError } = await db
  .from('users')
  .select('id,name,username,email,role,status')
  .ilike('username', username)
  .maybeSingle();

if (lookupUsernameError) {
  throw new Error('Unable to check for existing username.');
}

const existing = existingByEmail || existingByUsername;

if (existing && (existing.role !== 'admin' || existing.status !== 'active')) {
  throw new Error(
    'That email or username belongs to a non-admin or inactive account; no changes were made.',
  );
}

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
  must_change_password: false,
  password_expires_at: null,
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
if (result.error) {
  throw new Error(
    'Unable to save the administrator profile: ' + JSON.stringify(result.error),
  );
}
await db.from('app_sessions').delete().eq('user_id', user.id);

console.log(
  `Admin account '${username}' (${email}) successfully ${existing ? 'updated' : 'created'} with your password.`,
);

if (appUrl && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
  const message = {
    from: process.env.RESEND_FROM_EMAIL,
    to: [email],
    ...credentialsEmail({ name, username, email }, password, appUrl),
  };
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
    if (response.ok) {
      console.log(`Confirmation email sent to ${email}.`);
    } else {
      console.warn(`Resend email delivery skipped or failed (${response.status}).`);
    }
  } catch (err) {
    console.warn(`Could not send email via Resend: ${err.message}`);
  }
} else {
  console.log('You can now log in directly using your username and password.');
}
