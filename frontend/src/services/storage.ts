import { User, MatrimonialRecord, ActivityLog } from '../types';
import { apiRequest } from './api';

// Server-filtered data is cached only in memory for the authenticated session.
let users: User[] = [];
let records: MatrimonialRecord[] = [];
let logs: ActivityLog[] = [];
let currentUser: User | null = null;
let generation = 0;
export const fromDatabase = <T>(row: Record<string, unknown>): T =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      value ?? '',
    ]),
  ) as T;
export const toDatabase = (row: object) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
      value,
    ]),
  );
export const getStoredUsers = () => users;
export const getStoredRecords = () => records;
export const getStoredLogs = () => logs;
export const getCurrentUser = () => currentUser;
export function clearWorkspace() {
  generation++;
  users = [];
  records = [];
  logs = [];
  currentUser = null;
}
export async function loadWorkspace(): Promise<User> {
  const version = generation;
  const workspace = await apiRequest<{
    user: Record<string, unknown>;
    users: Record<string, unknown>[];
    records: Record<string, unknown>[];
    logs: Record<string, unknown>[];
  }>('/workspace');
  if (version !== generation)
    throw new Error('The session changed. Please try again.');
  records = workspace.records.map((row) =>
    fromDatabase<MatrimonialRecord>(row),
  );
  users = workspace.users.map((row) => {
    const entry = fromDatabase<User>(row);
    if (
      entry.status === 'active' &&
      entry.expiryDate &&
      Date.parse(entry.expiryDate) <= Date.now()
    )
      entry.status = 'expired';
    const completed = records.filter(
      (r) => r.operatorId === entry.id && r.status === 'Submitted',
    ).length;
    return {
      ...entry,
      completedRecords: completed,
      pendingRecords: Math.max(0, entry.assignedRecords - completed),
    };
  });
  logs = workspace.logs.map((row) => fromDatabase<ActivityLog>(row));
  const user = fromDatabase<User>(workspace.user);
  currentUser = users.find((u) => u.id === user.id) ?? user;
  return currentUser;
}
export async function updateOperator(user: User) {
  await apiRequest(`/admin/operators/${encodeURIComponent(user.id)}`, {
    method: 'PATCH',
    body: {
      name: user.name,
      mobile: user.mobile,
      assignedRecords: user.assignedRecords,
      expiryDate: user.expiryDate || null,
      status: user.status,
    },
  });
}
export async function deleteRecord(id: string) {
  await apiRequest(`/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
  records = records.filter((r) => r.id !== id);
}
export async function saveRecord(
  record: MatrimonialRecord,
): Promise<MatrimonialRecord> {
  const payload = toDatabase(record);
  payload.age = record.age === '' ? null : Number(record.age);
  payload.submitted_at =
    record.status === 'Submitted'
      ? record.submittedAt || new Date().toISOString()
      : null;
  payload.last_updated_on = new Date().toISOString();
  const result = await apiRequest<{ record: Record<string, unknown> }>(
    '/records',
    {
      method: 'PUT',
      body: {
        ...record,
        age: payload.age,
        submittedAt: payload.submitted_at,
        lastUpdatedOn: payload.last_updated_on,
      },
    },
  );
  const saved = fromDatabase<MatrimonialRecord>(result.record);
  records = [...records.filter((r) => r.id !== saved.id), saved];
  return saved;
}
export function getOperatorSlots(operator: User) {
  return Array.from(
    { length: Math.max(0, operator.assignedRecords) },
    (_, index) => ({
      slotNumber: index + 1,
      record: records.find(
        (r) => r.operatorId === operator.id && r.slotNumber === index + 1,
      ),
    }),
  );
}
export async function saveOperatorRecord(
  record: Partial<MatrimonialRecord> & {
    slotNumber: number;
    operatorId: string;
  },
) {
  if (!currentUser || currentUser.id !== record.operatorId)
    throw new Error('Please sign in again.');
  const existing = records.find(
    (r) =>
      r.operatorId === record.operatorId && r.slotNumber === record.slotNumber,
  );
  return saveRecord({
    ...record,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    submittedByName: currentUser.name,
    submittedByUsername: currentUser.username,
  } as MatrimonialRecord);
}
