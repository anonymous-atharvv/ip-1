import crypto from 'crypto';

const ADJECTIVES = ['silent', 'neon', 'cipher', 'ghost', 'static', 'zero'];
const NOUNS = ['specter', 'node', 'proxy', 'signal', 'vector', 'socket'];

export function createAnonId() {
  const adjective = ADJECTIVES[crypto.randomInt(0, ADJECTIVES.length)];
  const noun = NOUNS[crypto.randomInt(0, NOUNS.length)];
  const suffix = crypto.randomInt(1000, 9999);
  return `${adjective}-${noun}-${suffix}`;
}

export function createMessageId() {
  return crypto.randomUUID();
}
