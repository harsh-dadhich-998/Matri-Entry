import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const PASSWORD_BYTES = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function isStrongPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, PASSWORD_BYTES, SCRYPT_OPTIONS);
  return `scrypt$1$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  if (
    typeof password !== 'string' ||
    password.length > 128 ||
    typeof encoded !== 'string'
  )
    return false;
  const [algorithm, version, saltText, hashText, extra] = encoded.split('$');
  if (
    algorithm !== 'scrypt' ||
    version !== '1' ||
    !saltText ||
    !hashText ||
    extra !== undefined
  )
    return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length !== 16 || expected.length !== PASSWORD_BYTES) return false;
    const actual = Buffer.from(
      await scrypt(password, salt, PASSWORD_BYTES, SCRYPT_OPTIONS),
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export const DUMMY_PASSWORD_HASH = await hashPassword(
  randomBytes(32).toString('hex'),
);
