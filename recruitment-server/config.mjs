import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const RECIPIENT = 'info@cashpayall.com';
export function fault(status, code, message, fields) { return Object.assign(new Error(message), { status, code, ...(fields ? { fields } : {}) }); }
export function emailAddress(value) {
  return typeof value === 'string' && value.length <= 254 && !/[\u0000-\u0020\u007f]/.test(value) && /^[^@<>(),;:"\\]+@[^@<>(),;:"\\]+\.[^@<>(),;:"\\]+$/.test(value);
}
export function configuration(env = process.env) {
  let origin;
  try { const url = new URL(env.SITE_ORIGIN || 'https://cashpay-all.com'); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error(); if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error(); origin = url.origin; }
  catch { throw fault(503, 'RECRUITMENT_NOT_CONFIGURED', 'Le service de recrutement doit être configuré.'); }
  const dataDir = resolve(env.RECRUITMENT_DATA_DIR || '/var/lib/cashpay-recruitment');
  const publicRoot = resolve(PROJECT_ROOT);
  if (dataDir === publicRoot || dataDir.startsWith(publicRoot + '/')) throw fault(503, 'PRIVATE_STORAGE_REQUIRED', 'Le dossier privé de recrutement doit être configuré hors du site public.');
  const to = env.RECRUITMENT_TO || RECIPIENT;
  const from = env.SMTP_FROM;
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE === 'true';
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && from && emailAddress(from) && emailAddress(to) && [465, 587].includes(port) && ((port === 465 && secure) || (port === 587 && !secure)) && !/[\r\n]/.test(env.SMTP_HOST));
  return { origin, dataDir, to, from, smtpConfigured,
    smtp: { host: env.SMTP_HOST, port, secure, requireTLS: !secure, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }, tls: { rejectUnauthorized: true }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 },
    trustedProxies: String(env.TRUST_PROXY_IPS || '').split(',').map(x => x.trim()).filter(Boolean),
    maxAttempts: 8, retentionDays: Math.max(1, Math.min(3650, Number(env.RECRUITMENT_RETENTION_DAYS) || 180)) };
}
