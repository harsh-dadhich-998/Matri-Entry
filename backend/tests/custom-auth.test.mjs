import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionToken, hashPassword, hashSessionToken, isStrongPassword, verifyPassword } from '../server/security.mjs';

test('password hashes are salted, verifiable, and do not expose the password', async () => {
  const password = 'LongNewPassword!123';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.ok(await verifyPassword(password, first));
  assert.equal(await verifyPassword('WrongPassword!123', first), false);
});

test('password policy requires length and character variety', () => {
  assert.equal(isStrongPassword('LongNewPassword!123'), true);
  assert.equal(isStrongPassword('short'), false);
  assert.equal(isStrongPassword('longpassword123'), false);
});

test('session tokens are random and only their digest is suitable for storage', () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first, second);
  assert.notEqual(hashSessionToken(first), first);
  assert.notEqual(hashSessionToken(first), hashSessionToken(second));
});