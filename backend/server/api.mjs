import express from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  createSessionToken,
  DUMMY_PASSWORD_HASH,
  hashPassword,
  hashSessionToken,
  isStrongPassword,
  verifyPassword,
} from './security.mjs';
import { credentialsEmail } from './email.mjs';

const SESSION_COOKIE = 'matrientry_session';
const SESSION_LENGTH = 12 * 60 * 60 * 1000;
const PASSWORD_LENGTH = 24;
const SAFE_USER_FIELDS =
  'id,name,username,role,mobile,email,assigned_records,completed_records,pending_records,first_login,expiry_date,expiry_days,status,created_at';
const RECORD_FIELDS = [
  'slotNumber',
  'status',
  'profileId',
  'postedOn',
  'fullName',
  'gender',
  'age',
  'education',
  'educationDetail',
  'occupation',
  'annualIncome',
  'maritalStatus',
  'religion',
  'caste',
  'subCaste',
  'gothram',
  'familyType',
  'motherTongue',
  'star',
  'raasiMoonSign',
  'dhoshamManglik',
  'horoscopeMatch',
  'height',
  'weight',
  'bodyType',
  'physicalStatus',
  'complexion',
  'eatingHabit',
  'smokeHabit',
  'drinkHabit',
  'citizenOf',
  'countryLivingIn',
  'homeState',
  'familyValue',
  'familyStatus',
  'mobileNumber',
  'aboutFamily',
  'moreDescription',
  'expectations',
  'additionalNotes',
];

const route = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

function getCookie(req, name) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  try {
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
  } catch {
    return '';
  }
}

function safeUser(user) {
  const {
    password_hash,
    must_change_password,
    password_expires_at,
    ...profile
  } = user;
  return profile;
}

function makeTemporaryPassword() {
  return `Aa9!${randomBytes(PASSWORD_LENGTH).toString('base64url')}`;
}

function allowedOrigin(req, env) {
  const origin = req.get('origin');
  if (!origin) return true;
  const configured = (env.FRONTEND_URL || env.APP_URL || '').replace(/\/$/, '');
  if (configured && origin === configured) return true;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000') return true;
  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}

function getSameSite(env) {
  if (env?.COOKIE_SAMESITE) return env.COOKIE_SAMESITE.toLowerCase();
  return 'strict';
}

function setSessionCookie(res, token, production, env) {
  const sameSite = getSameSite(env);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: sameSite === 'none' ? true : production,
    sameSite,
    path: '/',
    maxAge: SESSION_LENGTH,
  });
}

function clearSessionCookie(res, production, env) {
  const sameSite = getSameSite(env);
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: sameSite === 'none' ? true : production,
    sameSite,
    path: '/',
  });
}

function logActivity(db, user, action, description, type) {
  return db.from('activity_logs').insert({
    user_id: user.id,
    username: user.username,
    action,
    description,
    type,
  });
}

async function readAll(db, table, columns, filter) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    let query = db
      .from(table)
      .select(columns)
      .order('id')
      .range(offset, offset + 499);
    if (filter) query = query.eq(filter[0], filter[1]);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

async function sendCredentials(user, password, env, fetchImpl) {
  const loginUrl = (env.FRONTEND_URL || env.APP_URL || '').replace(/\/$/, '');
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !loginUrl)
    return false;
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...credentialsEmail(user, password, loginUrl),
        from: env.RESEND_FROM_EMAIL,
        to: [user.email],
      }),
      signal: AbortSignal.timeout(10000),
    });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

export function createApiRouter({
  db,
  env = process.env,
  production = process.env.NODE_ENV === 'production',
  now = () => Date.now(),
  fetchImpl = fetch,
}) {
  const router = express.Router();
  const attempts = new Map();
  const addOriginCheck = (req, res, next) =>
    allowedOrigin(req, env)
      ? next()
      : res.status(403).json({ error: 'Origin not allowed.' });
  const requireAdmin = (req, res, next) =>
    req.user?.role === 'admin'
      ? next()
      : res.status(403).json({ error: 'Administrator access required.' });

  router.post(
    '/auth/login',
    addOriginCheck,
    route(async (req, res) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const windowStart = now() - 15 * 60 * 1000;
      // Discard expired entries so the process does not retain every visitor IP.
      for (const [address, timestamps] of attempts) {
        if (timestamps.at(-1) <= windowStart) attempts.delete(address);
      }
      const recentAttempts = (attempts.get(ip) || []).filter(
        (value) => value > windowStart,
      );
      if (recentAttempts.length >= 10)
        return res
          .status(429)
          .json({ error: 'Too many sign-in attempts. Try again later.' });
      recentAttempts.push(now());
      attempts.set(ip, recentAttempts);

      const username =
        typeof req.body?.username === 'string' && req.body.username.trim()
          ? req.body.username.trim()
          : typeof req.body?.email === 'string' && req.body.email.trim()
            ? req.body.email.trim()
            : '';
      const password =
        typeof req.body?.password === 'string' ? req.body.password : '';
      if (
        !username ||
        username.length > 254 ||
        !password ||
        password.length > 128
      )
        return res
          .status(401)
          .json({ error: 'The username or password is incorrect.' });

      let query = db.from('users').select('*');
      if (username.includes('@')) {
        query = query.ilike('email', username.toLowerCase());
      } else {
        query = query.ilike('username', username.toLowerCase());
      }
      const { data: user, error } = await query.maybeSingle();
      const passwordMatches = await verifyPassword(
        password,
        user?.password_hash || DUMMY_PASSWORD_HASH,
      );
      if (error || !user || !passwordMatches)
        return res
          .status(401)
          .json({ error: 'The username or password is incorrect.' });
      if (
        user.status !== 'active' ||
        (user.expiry_date && Date.parse(user.expiry_date) <= now())
      )
        return res.status(403).json({
          error:
            'This account is inactive or expired. Contact your administrator.',
        });

      attempts.delete(ip);
      const token = createSessionToken();
      const expiresAt = new Date(now() + SESSION_LENGTH).toISOString();
      const { error: sessionError } = await db.from('app_sessions').insert({
        token_hash: hashSessionToken(token),
        user_id: user.id,
        expires_at: expiresAt,
      });
      if (sessionError) throw sessionError;
      setSessionCookie(res, token, production, env);
      res.json({
        user: safeUser(user),
        mustChangePassword: Boolean(user.must_change_password),
        passwordExpiresAt: user.password_expires_at,
      });
    }),
  );

  router.use(
    route(async (req, res, next) => {
      const token = getCookie(req, SESSION_COOKIE);
      if (!token) return res.status(401).json({ error: 'Please sign in.' });
      const { data: session, error: sessionError } = await db
        .from('app_sessions')
        .select('user_id,expires_at')
        .eq('token_hash', hashSessionToken(token))
        .gt('expires_at', new Date(now()).toISOString())
        .maybeSingle();
      if (sessionError || !session) {
        clearSessionCookie(res, production, env);
        return res
          .status(401)
          .json({ error: 'Your session has ended. Please sign in again.' });
      }
      const { data: user, error: userError } = await db
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single();
      if (
        userError ||
        !user ||
        user.status !== 'active' ||
        (user.expiry_date && Date.parse(user.expiry_date) <= now())
      ) {
        await db
          .from('app_sessions')
          .delete()
          .eq('token_hash', hashSessionToken(token));
        clearSessionCookie(res, production, env);
        return res.status(401).json({
          error:
            'This account is inactive or expired. Contact your administrator.',
        });
      }
      req.user = user;
      req.sessionTokenHash = hashSessionToken(token);
      const allowedWhileChanging = [
        '/auth/session',
        '/auth/change-password',
        '/auth/logout',
      ].includes(req.path);
      if (user.must_change_password && !allowedWhileChanging)
        return res.status(403).json({
          error: 'Change your temporary password before opening the workspace.',
        });
      next();
    }),
  );

  router.get('/auth/session', (req, res) =>
    res.json({
      user: safeUser(req.user),
      mustChangePassword: Boolean(req.user.must_change_password),
      passwordExpiresAt: req.user.password_expires_at,
    }),
  );

  router.post(
    '/auth/logout',
    addOriginCheck,
    route(async (req, res) => {
      await db
        .from('app_sessions')
        .delete()
        .eq('token_hash', req.sessionTokenHash);
      clearSessionCookie(res, production, env);
      res.json({ success: true });
    }),
  );

  router.post(
    '/auth/change-password',
    addOriginCheck,
    route(async (req, res) => {
      const { currentPassword, newPassword } = req.body || {};
      if (!(await verifyPassword(currentPassword, req.user.password_hash)))
        return res
          .status(401)
          .json({ error: 'The current password is incorrect.' });
      if (
        req.user.password_expires_at &&
        Date.parse(req.user.password_expires_at) <= now()
      )
        return res.status(403).json({
          error:
            'Your temporary password has expired. Ask an administrator to reset it.',
        });
      if (!isStrongPassword(newPassword))
        return res.status(400).json({
          error:
            'Use 8–128 characters, including uppercase and lowercase letters, a number, and a symbol.',
        });
      if (currentPassword === newPassword)
        return res.status(400).json({
          error: 'Choose a password different from the temporary password.',
        });
      const passwordHash = await hashPassword(newPassword);
      const { error } = await db
        .from('users')
        .update({
          password_hash: passwordHash,
          must_change_password: false,
          password_expires_at: null,
        })
        .eq('id', req.user.id);
      if (error) throw error;
      await db.from('app_sessions').delete().eq('user_id', req.user.id);
      clearSessionCookie(res, production, env);
      res.json({ success: true });
    }),
  );

  router.get(
    '/workspace',
    route(async (req, res) => {
      const admin = req.user.role === 'admin';
      const [users, records, logsResult] = await Promise.all([
        readAll(
          db,
          'users',
          SAFE_USER_FIELDS,
          admin ? null : ['id', req.user.id],
        ),
        readAll(
          db,
          'matrimonial_records',
          '*',
          admin ? null : ['operator_id', req.user.id],
        ),
        (admin
          ? db.from('activity_logs').select('*')
          : db.from('activity_logs').select('*').eq('user_id', req.user.id)
        )
          .order('timestamp', { ascending: false })
          .limit(100),
      ]);
      if (logsResult.error) throw logsResult.error;
      res.json({
        user: safeUser(req.user),
        users,
        records,
        logs: logsResult.data,
      });
    }),
  );

  router.post(
    '/admin/operators',
    addOriginCheck,
    requireAdmin,
    route(async (req, res) => {
      const body = req.body || {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email =
        typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const username =
        typeof body.username === 'string'
          ? body.username.trim().toLowerCase()
          : '';
      const role = body.role === undefined ? 'operator' : body.role;
      const assignedRecords = role === 'admin' ? 0 : body.assignedRecords;
      if (
        !name ||
        name.length > 100 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        !/^[a-z0-9_]{3,40}$/.test(username) ||
        !['admin', 'operator'].includes(role) ||
        !Number.isInteger(assignedRecords) ||
        assignedRecords < 0 ||
        assignedRecords > 10000
      ) {
        return res.status(400).json({ error: 'Invalid account details.' });
      }
      if (
        body.expiryDate &&
        (!Number.isFinite(Date.parse(body.expiryDate)) ||
          Date.parse(body.expiryDate) <= now())
      )
        return res.status(400).json({ error: 'Expiry must be a future date.' });
      const [{ data: existingUsername }, { data: existingEmail }] =
        await Promise.all([
          db.from('users').select('id').eq('username', username).maybeSingle(),
          db.from('users').select('id').ilike('email', email).maybeSingle(),
        ]);
      if (existingUsername || existingEmail)
        return res.status(409).json({
          error: 'That username or email already belongs to an account.',
        });

      const password = makeTemporaryPassword();
      const user = {
        id: randomUUID(),
        name,
        username,
        email,
        mobile: String(body.mobile || '').slice(0, 30),
        role,
        assigned_records: assignedRecords,
        completed_records: 0,
        pending_records: assignedRecords,
        expiry_date: body.expiryDate || null,
        status: 'active',
        password_hash: await hashPassword(password),
        must_change_password: true,
        password_expires_at: new Date(
          now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      const { error } = await db.from('users').insert(user);
      if (error) throw error;
      const emailSent = await sendCredentials(user, password, env, fetchImpl);
      await logActivity(
        db,
        req.user,
        `${role === 'admin' ? 'Admin' : 'Operator'} created`,
        `${role} ${username}; email ${emailSent ? 'accepted by provider' : 'failed'}`,
        'user_management',
      );
      res.status(201).json({ success: true, emailSent, userId: user.id });
    }),
  );

  router.post(
    '/admin/operators/:id/reset-password',
    addOriginCheck,
    requireAdmin,
    route(async (req, res) => {
      const { data: user, error: lookupError } = await db
        .from('users')
        .select('*')
        .eq('id', req.params.id)
        .eq('role', 'operator')
        .single();
      if (
        lookupError ||
        !user ||
        user.status !== 'active' ||
        (user.expiry_date && Date.parse(user.expiry_date) <= now())
      )
        return res.status(400).json({
          error:
            'An active operator account is required. Extend expired access first.',
        });
      const password = makeTemporaryPassword();
      const { error } = await db
        .from('users')
        .update({
          password_hash: await hashPassword(password),
          must_change_password: true,
          password_expires_at: new Date(
            now() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await db.from('app_sessions').delete().eq('user_id', user.id);
      const emailSent = await sendCredentials(user, password, env, fetchImpl);
      await logActivity(
        db,
        req.user,
        'Temporary password reset',
        `Operator ${user.username}; email ${emailSent ? 'accepted by provider' : 'failed'}`,
        'user_management',
      );
      res.json({ success: true, emailSent });
    }),
  );

  router.patch(
    '/admin/operators/:id',
    addOriginCheck,
    requireAdmin,
    route(async (req, res) => {
      const body = req.body || {};
      const assignedRecords = body.assignedRecords;
      const status = body.status;
      if (
        !Number.isInteger(assignedRecords) ||
        assignedRecords < 0 ||
        assignedRecords > 10000 ||
        !['active', 'inactive', 'expired'].includes(status)
      )
        return res.status(400).json({ error: 'Invalid operator settings.' });
      if (body.expiryDate && !Number.isFinite(Date.parse(body.expiryDate)))
        return res.status(400).json({ error: 'Invalid expiry date.' });
      const update = {
        name: String(body.name || '')
          .trim()
          .slice(0, 100),
        mobile: String(body.mobile || '').slice(0, 30),
        assigned_records: assignedRecords,
        expiry_date: body.expiryDate || null,
        status,
      };
      const { data, error } = await db
        .from('users')
        .update(update)
        .eq('id', req.params.id)
        .eq('role', 'operator')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return res.status(404).json({ error: 'Operator account not found.' });
      await logActivity(
        db,
        req.user,
        'Operator updated',
        'Operator account changed',
        'user_management',
      );
      res.json({ success: true });
    }),
  );

  router.put(
    '/records',
    addOriginCheck,
    route(async (req, res) => {
      const body = req.body || {};
      const operatorId = String(body.operatorId || '');
      const slotNumber = Number(body.slotNumber);
      if (!Number.isInteger(slotNumber) || slotNumber < 1)
        return res.status(400).json({ error: 'Invalid record slot.' });
      if (
        req.user.role !== 'admin' &&
        (operatorId !== req.user.id || slotNumber > req.user.assigned_records)
      )
        return res
          .status(403)
          .json({ error: 'You cannot edit this record slot.' });
      const { data: owner, error: ownerError } = await db
        .from('users')
        .select('id,name,username,role,status,expiry_date,assigned_records')
        .eq('id', operatorId)
        .single();
      if (
        ownerError ||
        !owner ||
        owner.role !== 'operator' ||
        owner.status !== 'active' ||
        (owner.expiry_date && Date.parse(owner.expiry_date) <= now())
      )
        return res.status(403).json({
          error: 'The record owner does not have active operator access.',
        });
      if (slotNumber > owner.assigned_records)
        return res
          .status(403)
          .json({ error: 'This slot is not assigned to the operator.' });
      const { data: existing, error: existingError } = await db
        .from('matrimonial_records')
        .select('id,created_at,submitted_at')
        .eq('operator_id', operatorId)
        .eq('slot_number', slotNumber)
        .maybeSingle();
      if (existingError) throw existingError;
      const payload = Object.fromEntries(
        RECORD_FIELDS.filter((field) => field in body).map((field) => [
          field.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`),
          body[field],
        ]),
      );
      if (!['Draft', 'Submitted'].includes(payload.status))
        return res.status(400).json({ error: 'Invalid record status.' });
      payload.id = existing?.id || randomUUID();
      payload.operator_id = operatorId;
      payload.slot_number = slotNumber;
      payload.submitted_by_name = owner.name;
      payload.submitted_by_username = owner.username;
      payload.created_at =
        existing?.created_at || new Date(now()).toISOString();
      payload.last_updated_on = new Date(now()).toISOString();
      payload.submitted_at =
        payload.status === 'Submitted'
          ? existing?.submitted_at || new Date(now()).toISOString()
          : null;
      payload.age =
        payload.age === '' || payload.age == null ? null : Number(payload.age);
      if (
        payload.age !== null &&
        (!Number.isInteger(payload.age) ||
          payload.age < 18 ||
          payload.age > 120)
      )
        return res.status(400).json({ error: 'Enter a valid age.' });
      const { data, error } = await db
        .from('matrimonial_records')
        .upsert(payload, { onConflict: 'operator_id,slot_number' })
        .select()
        .single();
      if (error) throw error;
      await logActivity(
        db,
        req.user,
        payload.status === 'Submitted' ? 'Record submitted' : 'Record saved',
        `Slot ${slotNumber}`,
        'submission',
      );
      res.json({ record: data });
    }),
  );

  router.delete(
    '/records/:id',
    addOriginCheck,
    requireAdmin,
    route(async (req, res) => {
      const { data, error } = await db
        .from('matrimonial_records')
        .delete()
        .eq('id', req.params.id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Record not found.' });
      await logActivity(
        db,
        req.user,
        'Record deleted',
        `Record ${req.params.id}`,
        'submission',
      );
      res.json({ success: true });
    }),
  );

  return router;
}
