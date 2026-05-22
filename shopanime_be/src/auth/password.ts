import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_ALGORITHM = 'scrypt';
const BASE64_PREFIX = 'base64:';

export function encodePasswordHash(rawHash: string) {
  return `${BASE64_PREFIX}${Buffer.from(rawHash, 'utf8').toString('base64')}`;
}

export function decodePasswordHash(storedHash: string) {
  if (!storedHash.startsWith(BASE64_PREFIX)) {
    return storedHash;
  }

  try {
    return Buffer.from(storedHash.slice(BASE64_PREFIX.length), 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function isPlainScryptPasswordHash(storedHash: string) {
  return storedHash.startsWith(`${HASH_ALGORITHM}:`);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return encodePasswordHash(`${HASH_ALGORITHM}:${salt}:${derivedKey.toString('hex')}`);
}

export async function verifyPassword(password: string, storedHash: string) {
  const decodedHash = decodePasswordHash(storedHash);
  const [algorithm, salt, key] = decodedHash.split(':');
  if (algorithm !== HASH_ALGORITHM || !salt || !key) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(key, 'hex');
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
