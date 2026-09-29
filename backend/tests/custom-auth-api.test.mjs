import assert from 'node:assert/strict';
import express from 'express';
import { test } from 'node:test';
import { createApiRouter } from '../server/api.mjs';
import { hashPassword, verifyPassword } from '../server/security.mjs';

class MemoryQuery {
  constructor(tables, table) { this.tables = tables; this.table = table; this.filters = []; this.action = 'select'; }
  select(fields = '*') { this.fields = fields; return this; }
  eq(field, value) { this.filters.push(row => row[field] === value); return this; }
  ilike(field, value) { this.filters.push(row => String(row[field] || '').toLowerCase() === String(value).toLowerCase()); return this; }
  gt(field, value) { this.filters.push(row => row[field] > value); return this; }
  order() { return this; }
  limit() { return this; }
  range(start, end) { this.bounds = [start, end]; return this; }
  insert(value) { this.action = 'insert'; this.value = value; return this; }
  update(value) { this.action = 'update'; this.value = value; return this; }
  delete() { this.action = 'delete'; return this; }
  async maybeSingle() { return this.result('maybeSingle'); }
  async single() { return this.result('single'); }
  then(resolve, reject) { return this.result('many').then(resolve, reject); }
  async result(mode) {
    const rows = this.tables[this.table] || (this.tables[this.table] = []);
    const matched = rows.filter(row => this.filters.every(filter => filter(row)));
    if (this.action === 'insert') {
      rows.push(...(Array.isArray(this.value) ? this.value : [this.value]));
      return { data: null, error: null };
    }
    if (this.action === 'update') {
      matched.forEach(row => Object.assign(row, this.value));
    }
    if (this.action === 'delete') {
      this.tables[this.table] = rows.filter(row => !matched.includes(row));
    }
    const result = this.action === 'delete' ? matched : matched;
    const project = row => {
      if (!this.fields || this.fields === '*') return row;
      return Object.fromEntries(this.fields.split(',').map(field => [field, row[field]]));
    };
    if (mode === 'single') return result.length === 1 ? { data: project(result[0]), error: null } : { data: null, error: new Error('Expected one row') };
    if (mode === 'maybeSingle') return result.length <= 1 ? { data: result[0] ? project(result[0]) : null, error: null } : { data: null, error: new Error('Expected at most one row') };
    const projected = result.map(project);
    return { data: this.bounds ? projected.slice(this.bounds[0], this.bounds[1] + 1) : projected, error: null };
  }
}

async function startHarness({ env = {}, fetchImpl = async () => new Response('{}', { status: 200 }) } = {}) {
  const password = 'AdminPassword!123';
  const admin = { id: 'admin-id', name: 'Admin', username: 'admin', email: 'admin@example.test', role: 'admin', status: 'active', assigned_records: 0, password_hash: await hashPassword(password), must_change_password: false };
  const operator = { id: 'operator-id', name: 'Operator', username: 'operator', email: 'operator@example.test', role: 'operator', status: 'active', assigned_records: 2, password_hash: await hashPassword(password), must_change_password: false };
  const tables = {
    users: [admin, operator], app_sessions: [],
    matrimonial_records: [
      { id: 'admin-record', operator_id: 'other-operator', slot_number: 1 },
      { id: 'operator-record', operator_id: operator.id, slot_number: 1 },
    ], activity_logs: [],
  };
  const db = { from: table => new MemoryQuery(tables, table) };
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter({ db, env, production: false, fetchImpl }));
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  return { baseUrl, server, tables, password };
}

test('custom API rejects workspace requests without a session', async t => {
  const harness = await startHarness();
  t.after(() => harness.server.close());
  const response = await fetch(`${harness.baseUrl}/workspace`);
  assert.equal(response.status, 401);
});

test('admin workspace reads continue past the PostgREST page boundary', async t => {
  const harness = await startHarness();
  t.after(() => harness.server.close());
  harness.tables.matrimonial_records = Array.from({ length: 501 }, (_, index) => ({ id: `record-${index}`, operator_id: 'operator-id', slot_number: index + 1 }));
  const login = await fetch(`${harness.baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: harness.password }),
  });
  const cookie = login.headers.get('set-cookie').split(';', 1)[0];
  const response = await fetch(`${harness.baseUrl}/workspace`, { headers: { Cookie: cookie } });
  assert.equal((await response.json()).records.length, 501);
});

test('operator sessions are scoped to their data and cannot call admin routes', async t => {
  const harness = await startHarness();
  t.after(() => harness.server.close());
  const login = await fetch(`${harness.baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'operator@example.test', password: harness.password }),
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  assert.equal('password_hash' in loginBody.user, false);
  const cookieHeader = login.headers.get('set-cookie');
  assert.ok(cookieHeader.includes('HttpOnly'));
  assert.ok(cookieHeader.includes('SameSite=Strict'));
  const cookie = cookieHeader.split(';', 1)[0];
  const token = cookie.split('=', 2)[1];
  assert.notEqual(harness.tables.app_sessions[0].token_hash, token);

  const workspaceResponse = await fetch(`${harness.baseUrl}/workspace`, { headers: { Cookie: cookie } });
  assert.equal(workspaceResponse.status, 200);
  const workspace = await workspaceResponse.json();
  assert.deepEqual(workspace.users.map(user => user.id), ['operator-id']);
  assert.deepEqual(workspace.records.map(record => record.id), ['operator-record']);

  const adminResponse = await fetch(`${harness.baseUrl}/admin/operators`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Injected', email: 'new@example.test', username: 'new_operator', assignedRecords: 1 }),
  });
  assert.equal(adminResponse.status, 403);
});

test('admin-created operators receive temporary credentials by email, never in the API response', async t => {
  const emails = [];
  const harness = await startHarness({
    env: { APP_URL: 'https://app.example.test', RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'MatriEntry <login@example.test>' },
    fetchImpl: async (_url, options) => { emails.push(JSON.parse(options.body)); return new Response('{}', { status: 200 }); },
  });
  t.after(() => harness.server.close());
  const login = await fetch(`${harness.baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: harness.password }),
  });
  const cookie = login.headers.get('set-cookie').split(';', 1)[0];
  const response = await fetch(`${harness.baseUrl}/admin/operators`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New operator', username: 'new_operator', email: 'new@example.test', assignedRecords: 2 }),
  });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.emailSent, true);
  assert.equal(JSON.stringify(result).includes('Temporary password'), false);
  assert.equal(emails[0].to[0], 'new@example.test');
  assert.ok(emails[0].text.includes('Sign in: https://app.example.test'));
  const temporaryPassword = emails[0].text.match(/Temporary password: ([^\r\n]+)/)[1];
  const created = harness.tables.users.find(user => user.email === 'new@example.test');
  assert.equal(created.role, 'operator');
  assert.equal(created.must_change_password, true);
  assert.ok(await verifyPassword(temporaryPassword, created.password_hash));

  const operatorLogin = await fetch(`${harness.baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: created.email, password: temporaryPassword }),
  });
  const operatorCookie = operatorLogin.headers.get('set-cookie').split(';', 1)[0];
  const newPassword = 'UpdatedOperator!456';
  const change = await fetch(`${harness.baseUrl}/auth/change-password`, {
    method: 'POST', headers: { Cookie: operatorCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: temporaryPassword, newPassword }),
  });
  assert.equal(change.status, 200);
  assert.equal(created.must_change_password, false);
  assert.equal(harness.tables.app_sessions.some(session => session.user_id === created.id), false);
  const newLogin = await fetch(`${harness.baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: created.email, password: newPassword }),
  });
  assert.equal(newLogin.status, 200);

  const adminCreate = await fetch(`${harness.baseUrl}/admin/operators`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New admin', username: 'new_admin', email: 'new-admin@example.test', role: 'admin', assignedRecords: 500 }),
  });
  assert.equal(adminCreate.status, 201);
  const newAdmin = harness.tables.users.find(user => user.email === 'new-admin@example.test');
  assert.equal(newAdmin.role, 'admin');
  assert.equal(newAdmin.assigned_records, 0);
  assert.equal(emails[1].to[0], 'new-admin@example.test');
  assert.ok(emails[1].text.includes('Sign in: https://app.example.test'));
});