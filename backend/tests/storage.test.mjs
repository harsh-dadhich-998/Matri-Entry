import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const storagePath = existsSync(new URL('../src/services/storage.ts', import.meta.url))
  ? new URL('../src/services/storage.ts', import.meta.url)
  : new URL('../../frontend/src/services/storage.ts', import.meta.url);
const source = await readFile(storagePath, 'utf8');
const transformed = stripTypeScriptTypes(source.replace(/import \{ User, MatrimonialRecord, ActivityLog \} from '..\/types';/, '')
 .replace("import { apiRequest } from './api';", "const apiRequest = (...args) => globalThis[Symbol.for('matrientry-test-api')](...args);"));
const storage = await import(`data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`);
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profile = { id, role: 'operator', name: 'Account', username: 'account', status: 'active', assigned_records: 3, expiry_date: null };
const record = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', operator_id: id, slot_number: 1, status: 'Submitted', profile_id: 'PROFILE-1', full_name: 'Entered name', age: 30, created_at: new Date().toISOString() };
let api, failWrite, failDelete, savedPayload, rows, account;
function createBackend() {
 return async (path, options = {}) => {
    if (path === '/workspace') {
     if (account.status !== 'active' || (account.expiry_date && Date.parse(account.expiry_date) <= Date.now())) throw new Error('Your account is inactive or expired.');
     return { user: account, users: [account], records: rows, logs: [] };
    }
  if (path === '/records' && options.method === 'PUT') {
   if (failWrite) throw new Error('Database unavailable');
   savedPayload = storage.toDatabase(options.body);
   return { record: savedPayload };
  }
  if (path.startsWith('/records/') && options.method === 'DELETE') {
   if (failDelete) throw new Error('Access denied');
   return { success: true };
  }
  throw new Error(`Unexpected API request: ${path}`);
 };
}
beforeEach(() => {
 storage.clearWorkspace(); account = { ...profile }; rows = [{ ...record }]; failWrite = false; failDelete = false; savedPayload = null;
 api = createBackend(); globalThis[Symbol.for('matrientry-test-api')] = api;
});
test('loads only backend data and computes counters from real submissions', async () => {
 const user = await storage.loadWorkspace();
 assert.equal(user.completedRecords, 1); assert.equal(user.pendingRecords, 2);
 assert.equal(storage.getOperatorSlots(user).length, 3);
 assert.equal(storage.getOperatorSlots({ ...user, assignedRecords: 0 }).length, 0);
});
test('reads beyond the backend page limit', async () => {
 rows = Array.from({ length: 501 }, (_, i) => ({ ...record, id: String(i), slot_number: i + 1 }));
 await storage.loadWorkspace(); assert.equal(storage.getStoredRecords().length, 501);
});
test('inactive and expired profiles cannot initialize a workspace', async () => {
 account.status = 'inactive'; await assert.rejects(storage.loadWorkspace(), /inactive or expired/);
 assert.equal(storage.getCurrentUser(), null);
 account.status = 'active'; account.expiry_date = '2020-01-01'; await assert.rejects(storage.loadWorkspace(), /inactive or expired/);
});
test('failed saves preserve the cached record and report failure', async () => {
 await storage.loadWorkspace(); failWrite = true;
 await assert.rejects(storage.saveOperatorRecord({ ...storage.getStoredRecords()[0], fullName: 'Edited' }), /Database unavailable/);
 assert.equal(storage.getStoredRecords()[0].fullName, 'Entered name');
});
test('saving a different operator record is refused before making a request', async () => {
 await storage.loadWorkspace(); await assert.rejects(storage.saveOperatorRecord({ slotNumber: 1, operatorId: 'someone-else' }), /sign in again/);
 assert.equal(savedPayload, null);
});
test('new records use UUIDs and authenticated authorship', async () => {
 await storage.loadWorkspace();
 const result = await storage.saveOperatorRecord({ slotNumber: 2, operatorId: id, fullName: 'New entry', profileId: 'REAL-ID', age: '', status: 'Draft', submittedByName: 'Forged' });
 assert.match(result.id, /^[0-9a-f-]{36}$/); assert.equal(savedPayload.submitted_by_name, 'Account'); assert.equal(savedPayload.age, null);
 assert.equal(savedPayload.submitted_at, null); assert.equal(storage.getStoredRecords().length, 2);
});
test('failed deletes retain the record', async () => {
 await storage.loadWorkspace(); failDelete = true; await assert.rejects(storage.deleteRecord(record.id), /Access denied/);
 assert.equal(storage.getStoredRecords().length, 1);
});
test('signing out invalidates an in-flight workspace fetch', async () => {
 let release;
 api = path => path === '/workspace' ? new Promise(resolve => { release = resolve; }) : Promise.reject(new Error('Unexpected request'));
 globalThis[Symbol.for('matrientry-test-api')] = api;
 const loading = storage.loadWorkspace(); storage.clearWorkspace(); release({ data: { user: { id } }, error: null });
 await assert.rejects(loading, /session changed/); assert.equal(storage.getCurrentUser(), null); assert.equal(storage.getStoredRecords().length, 0);
});
