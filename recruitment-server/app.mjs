import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { configuration, fault } from './config.mjs';
import { validateApplication, MAX_REQUEST } from './validation.mjs';
import { createApplication } from './storage.mjs';
import { createMailer, deliverApplication } from './mailer.mjs';

export async function loadCatalog() { return JSON.parse(await readFile(new URL('../recruitment/catalog.json', import.meta.url), 'utf8')); }
export async function readMultipart(request) {
  const type = String(request.headers['content-type'] || '');
  if (!/^multipart\/form-data\s*;/i.test(type) || !/boundary=/i.test(type)) throw fault(415, 'MULTIPART_REQUIRED', 'Transmettez les documents avec le formulaire de candidature.');
  if (Number(request.headers['content-length']) > MAX_REQUEST) throw fault(413, 'REQUEST_TOO_LARGE', 'Le dossier est trop volumineux.');
  let size = 0; const chunks = [];
  for await (const chunk of request) { const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += bytes.length; if (size > MAX_REQUEST) throw fault(413, 'REQUEST_TOO_LARGE', 'Le dossier est trop volumineux.'); chunks.push(bytes); }
  try { return await new Request('http://recruitment.local/application', { method: 'POST', headers: { 'Content-Type': type }, body: Buffer.concat(chunks) }).formData(); }
  catch { throw fault(400, 'INVALID_MULTIPART', 'Le formulaire transmis est illisible. Veuillez réessayer.'); }
}
function rateLimiter(config, { now = Date.now } = {}) {
  const buckets = new Map();
  return request => {
    let ip = request.socket?.remoteAddress || 'unknown';
    if (config.trustedProxies.includes(ip)) for (const candidate of String(request.headers['x-forwarded-for'] || '').split(',').map(x => x.trim()).filter(isIP).reverse()) { ip = candidate; if (!config.trustedProxies.includes(ip)) break; }
    const time = now();
    for (const [key, bucket] of buckets) if (bucket.until <= time) buckets.delete(key);
    if (!buckets.has(ip)) { if (buckets.size >= 10000) throw fault(429, 'RATE_LIMITED', 'Le service est occupé. Réessayez dans quelques minutes.'); buckets.set(ip, { count: 0, until: time + 15 * 60000 }); }
    if (++buckets.get(ip).count > 12) throw fault(429, 'RATE_LIMITED', 'Trop de tentatives. Réessayez dans quelques minutes.');
  };
}
function send(response, request, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) });
  response.end(request.method === 'HEAD' ? undefined : body);
}
export function createApp({ env = process.env, config = configuration(env), catalog, mailer = createMailer(config), now } = {}) {
  if (!catalog?.countries || !catalog?.positions) throw Error('Recruitment catalog required');
  const rate = rateLimiter(config, { ...(now ? { now } : {}) });
  const handler = async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    response.setHeader('Referrer-Policy', 'no-referrer');
    try {
      const path = new URL(request.url, 'http://recruitment.local').pathname;
      if (path === '/api/recruitment/health' && ['GET', 'HEAD'].includes(request.method)) return send(response, request, 200, { data: { status: 'ok' } });
      if (path === '/api/recruitment/catalog' && ['GET', 'HEAD'].includes(request.method)) return send(response, request, 200, { data: catalog });
      if (path !== '/api/recruitment/applications') throw fault(404, 'NOT_FOUND', 'Cette ressource est introuvable.');
      if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); throw fault(405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.'); }
      const origin = request.headers.origin;
      if (origin !== config.origin || request.headers['x-requested-with'] !== 'XMLHttpRequest' || request.headers['sec-fetch-site'] === 'cross-site') throw fault(403, 'ORIGIN_REJECTED', 'L’origine de la candidature est refusée. Utilisez le formulaire du site CashPay All.');
      rate(request);
      if (!config.smtpConfigured) throw fault(503, 'MAIL_NOT_CONFIGURED', 'Le service d’envoi des candidatures n’est pas encore configuré. Votre dossier n’a pas été transmis.');
      const validated = await validateApplication(await readMultipart(request), catalog);
      const stored = await createApplication(config, validated);
      const record = stored.created ? await deliverApplication(config, stored.record.id, mailer) : stored.record;
      const emailStatus = record.email.status === 'sent' ? 'sent' : 'pending';
      return send(response, request, emailStatus === 'sent' ? (stored.created ? 201 : 200) : 202, { data: { reference: record.reference, emailStatus, receivedAt: record.receivedAt } });
    } catch (error) {
      const explicit = Number.isInteger(error.status) && error.status >= 400 && error.status <= 503;
      const status = explicit ? error.status : 503;
      if (status === 429) response.setHeader('Retry-After', '900');
      return send(response, request, status, { error: { code: explicit ? error.code : 'RECRUITMENT_UNAVAILABLE', message: explicit ? error.message : 'Le service ne peut pas traiter votre candidature pour le moment. Réessayez plus tard.', ...(explicit && error.fields ? { fields: error.fields } : {}) } });
    }
  };
  const server = createServer(handler); server.requestTimeout = 30000; server.headersTimeout = 10000;
  return { server, handler, mailer, config };
}
