import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, rm, readdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createApp, loadCatalog } from '../recruitment-server/app.mjs';
import { configuration } from '../recruitment-server/config.mjs';
import { validateApplication, MAX_FILE } from '../recruitment-server/validation.mjs';
import { createMailer, flushQueue } from '../recruitment-server/mailer.mjs';
import { readRecord, applicationDirectory, atomicJson, cleanOldApplications } from '../recruitment-server/storage.mjs';

const catalog = await loadCatalog();
const dummyPdf = Buffer.from('%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF\n');
const envFor = dataDir => ({ SITE_ORIGIN: 'https://cashpay-all.com', RECRUITMENT_DATA_DIR: dataDir, SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '587', SMTP_SECURE: 'false', SMTP_USER: 'fixture', SMTP_PASS: 'fixture-only-not-real', SMTP_FROM: 'recruitment@example.invalid' });
function form({ key = randomUUID(), fields = {}, cv = dummyPdf, extras = [] } = {}) {
  const data = new FormData();
  const defaults = { countryCode: 'CD', provinceId: catalog.countries.find(c => c.code === 'CD').provinces[0].id, positionId: catalog.positions[0].id,
    lastName: 'Test', postName: 'Candidat', firstName: 'Aline', email: 'candidate@example.invalid', phone: '+243 800 123 456', age: '31', message: 'Je vous présente ma candidature pour ce poste.', consent: 'true', idempotencyKey: key, website: '' };
  for (const [name, value] of Object.entries({ ...defaults, ...fields })) data.set(name, value);
  if (cv !== null) data.set('cv', new Blob([cv], { type: 'application/pdf' }), 'Mon CV.pdf');
  for (const extra of extras) data.append('documents', new Blob([extra], { type: 'application/pdf' }), 'justificatif.pdf');
  return data;
}
async function fixture(work, { failMail = false, transport } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'cashpay-recruitment-test-'));
  const config = configuration(envFor(directory)); const messages = [];
  const mailer = createMailer(config, { transport: transport || { async sendMail(message) { messages.push(message); if (failMail) throw Error('SMTP secret should never escape'); return { accepted: [config.to], rejected: [] }; } } });
  const app = createApp({ config, catalog, mailer });
  try { return await work({ directory, config, messages, mailer, app }); }
  finally { mailer.close(); await rm(directory, { recursive: true, force: true }); }
}
async function invoke(app, path = '/api/recruitment/applications', { method = 'POST', data = form(), headers = {}, raw, contentType } = {}) {
  const web = new Request('https://cashpay-all.com/api/recruitment/applications', { method: 'POST', body: data });
  const bytes = raw || Buffer.from(await web.arrayBuffer());
  const request = Readable.from(method === 'POST' ? [bytes] : []);
  Object.assign(request, { method, url: path, headers: { origin: 'https://cashpay-all.com', 'x-requested-with': 'XMLHttpRequest', 'content-type': contentType || web.headers.get('content-type'), 'content-length': String(bytes.length), ...headers }, socket: { remoteAddress: '127.0.0.1' } });
  let status = 200, responseBody = ''; const responseHeaders = {};
  await app.handler(request, { setHeader(k,v) { responseHeaders[k.toLowerCase()] = v; }, writeHead(s,h) { status = s; for (const [k,v] of Object.entries(h)) responseHeaders[k.toLowerCase()] = v; }, end(body) { responseBody = body || ''; } });
  return { status, headers: responseHeaders, body: responseBody ? JSON.parse(responseBody) : null };
}

test('catalogue opens only the DRC, has its 26 provinces and all eight requested profiles', () => {
  assert.equal(catalog.countries.length, 54); assert.deepEqual(catalog.countries.filter(c => c.available).map(c => c.code), ['CD']);
  assert.equal(catalog.countries.find(c => c.code === 'CD').provinces.length, 26); assert.equal(catalog.positions.length, 8);
  assert.equal(new Set(catalog.positions.map(p => p.id)).size, 8);
});
test('submission stores a private dossier and sends its summary plus CV to the exact requested mailbox', async () => fixture(async ({ app, config, messages }) => {
  const key = randomUUID(); const result = await invoke(app, undefined, { data: form({ key, extras: [dummyPdf] }) });
  assert.equal(result.status, 201); assert.equal(result.body.data.emailStatus, 'sent'); assert.match(result.body.data.reference, /^CP-/);
  assert.equal(messages.length, 1); assert.equal(messages[0].to, 'info@cashpayall.com'); assert.equal(messages[0].replyTo, 'candidate@example.invalid');
  assert.equal(messages[0].attachments.length, 3); assert.ok(messages[0].attachments[0].content.toString().includes('DOSSIER DE CANDIDATURE'));
  const record = await readRecord(config, key); assert.equal(record.email.status, 'sent'); assert.equal(record.files.length, 2);
  assert.equal((await stat(applicationDirectory(config, key))).mode & 0o777, 0o700);
  assert.equal((await stat(join(applicationDirectory(config, key), 'record.json'))).mode & 0o777, 0o600);
  assert.equal(JSON.stringify(result.body).includes('candidate@example.invalid'), false);
}));
test('identical retries reuse the same dossier and never resend the notification', async () => fixture(async ({ app, messages }) => {
  const key = randomUUID(); const first = await invoke(app, undefined, { data: form({ key }) }); const duplicate = await invoke(app, undefined, { data: form({ key }) });
  assert.equal(duplicate.status, 200); assert.equal(duplicate.body.data.reference, first.body.data.reference); assert.equal(messages.length, 1);
}));
test('reuse of an idempotency key for a different dossier is rejected', async () => fixture(async ({ app, messages }) => {
  const key = randomUUID(); await invoke(app, undefined, { data: form({ key }) });
  const conflict = await invoke(app, undefined, { data: form({ key, fields: { message: 'Un autre dossier.' } }) });
  assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT'); assert.equal(messages.length, 1);
}));
test('concurrent submissions with the same key send at most one notification', async () => fixture(async ({ app, messages }) => {
  const key = randomUUID(); const results = await Promise.all([invoke(app, undefined, { data: form({ key }) }), invoke(app, undefined, { data: form({ key }) })]);
  assert.ok(results.every(result => [200,201,202].includes(result.status))); assert.equal(results[0].body.data.reference, results[1].body.data.reference); assert.equal(messages.length, 1);
}));
test('SMTP failures keep a pending dossier and expose no provider details', async () => fixture(async ({ app, config }) => {
  const key = randomUUID(); const result = await invoke(app, undefined, { data: form({ key }) });
  assert.equal(result.status, 202); assert.equal(result.body.data.emailStatus, 'pending'); assert.equal(JSON.stringify(result).includes('SMTP secret'), false);
  const record = await readRecord(config, key); assert.equal(record.email.status, 'pending'); assert.equal(record.email.attempts, 1); assert.equal(record.email.lastErrorCode, 'SMTP_DELIVERY_FAILED');
}, { failMail: true }));
test('worker retries due failures and leaves sent dossiers alone', async () => fixture(async ({ app, config }) => {
  const key = randomUUID(); await invoke(app, undefined, { data: form({ key }) }); const record = await readRecord(config, key);
  let sends = 0; const success = { async send() { sends++; } };
  assert.equal((await flushQueue(config, success, { now: Date.parse(record.email.nextAttemptAt) - 1 })).inspected, 0);
  assert.equal((await flushQueue(config, success, { now: Date.parse(record.email.nextAttemptAt) + 1 })).sent, 1);
  assert.equal((await flushQueue(config, success, { now: Date.now() + 86400000 })).inspected, 0); assert.equal(sends, 1);
}, { failMail: true }));
test('a rejected SMTP recipient cannot be reported as a successful notification', async () => fixture(async ({ app, config }) => {
  const key = randomUUID(); const result = await invoke(app, undefined, { data: form({ key }) });
  assert.equal(result.status, 202); assert.equal(result.body.data.emailStatus, 'pending'); assert.equal((await readRecord(config, key)).email.status, 'pending');
}, { transport: { async sendMail() { return { accepted: [], rejected: ['info@cashpayall.com'] }; } } }));
test('repeated SMTP failure stops automatic attempts after the configured bound', async () => fixture(async ({ app, config, mailer }) => {
  const key = randomUUID(); await invoke(app, undefined, { data: form({ key }) });
  for (let attempt = 1; attempt < config.maxAttempts; attempt++) { const record = await readRecord(config, key); await flushQueue(config, mailer, { now: Date.parse(record.email.nextAttemptAt) + 1 }); }
  const record = await readRecord(config, key); assert.equal(record.email.attempts, 8); assert.equal(record.email.needsReview, true);
  assert.equal((await flushQueue(config, mailer, { now: Date.now() + 30 * 86400000 })).inspected, 0);
}, { failMail: true }));
test('missing SMTP configuration returns 503 before storing or pretending to deliver', async () => fixture(async ({ config, directory }) => {
  const app = createApp({ config: { ...config, smtpConfigured: false }, catalog, mailer: { async send() { throw Error('Must not send'); } } });
  const result = await invoke(app); assert.equal(result.status, 503); assert.equal(result.body.error.code, 'MAIL_NOT_CONFIGURED');
  assert.deepEqual(await readdir(directory), []);
}));
test('foreign origins, absent custom header, and unsupported methods cannot submit', async () => fixture(async ({ app }) => {
  assert.equal((await invoke(app, undefined, { headers: { origin: 'https://attacker.invalid' } })).status, 403);
  assert.equal((await invoke(app, undefined, { headers: { 'x-requested-with': '' } })).status, 403);
  assert.equal((await invoke(app, undefined, { method: 'GET' })).status, 405);
}));
test('submission attempts are rate limited without a wildcard CORS permission', async () => fixture(async ({ app }) => {
  const key = randomUUID(); for (let index = 0; index < 12; index++) await invoke(app, undefined, { data: form({ key }) });
  const result = await invoke(app, undefined, { data: form({ key }) }); assert.equal(result.status, 429); assert.equal(result.headers['retry-after'], '900'); assert.equal(result.headers['access-control-allow-origin'], undefined);
}));
test('validation rejects unavailable countries, foreign provinces and forged positions', async () => {
  for (const fields of [{ countryCode: 'RW' }, { provinceId: 'fake' }, { positionId: 'fake' }]) await assert.rejects(() => validateApplication(form({ fields }), catalog), e => e.status === 400);
});
test('consent, honeypot, recipient injection and duplicate fields are validated', async () => {
  for (const fields of [{ consent: 'false' }, { website: 'https://bot.invalid' }, { email: 'candidate@example.invalid\r\nBcc:secret@example.invalid' }, { age: '-2' }, { message: 'court' }]) await assert.rejects(() => validateApplication(form({ fields }), catalog), e => e.status === 400);
  const duplicated = form(); duplicated.append('countryCode', 'CD'); await assert.rejects(() => validateApplication(duplicated, catalog), e => e.status === 400);
  const destination = form(); destination.append('to', 'attacker@example.invalid'); await assert.rejects(() => validateApplication(destination, catalog), e => e.status === 400);
});
test('only real PDF signatures, one required CV and up to three extra documents are accepted', async () => {
  for (const data of [form({ cv: null }), form({ cv: Buffer.from('<script>bad</script>') }), form({ extras: [dummyPdf,dummyPdf,dummyPdf,dummyPdf] })]) await assert.rejects(() => validateApplication(data, catalog), e => e.status === 400);
  const wrongName = form(); wrongName.set('cv', new Blob([dummyPdf], { type: 'text/html' }), 'cv.html'); await assert.rejects(() => validateApplication(wrongName, catalog), e => e.status === 400);
});
test('file and total attachment limits are enforced before persistence', async () => {
  await assert.rejects(() => validateApplication(form({ cv: Buffer.alloc(MAX_FILE + 1) }), catalog), e => e.status === 413);
  await assert.rejects(() => validateApplication(form({ cv: Buffer.alloc(MAX_FILE), extras: [Buffer.alloc(MAX_FILE),Buffer.alloc(MAX_FILE),dummyPdf] }), catalog), e => e.status === 413);
});
test('malformed multipart and excessive request bodies have safe bounded errors', async () => fixture(async ({ app }) => {
  assert.equal((await invoke(app, undefined, { raw: Buffer.from('not multipart'), contentType: 'application/json' })).status, 415);
  assert.equal((await invoke(app, undefined, { headers: { 'content-length': String(30 * 1024 * 1024) } })).status, 413);
}));
test('there is no public application listing or document download route', async () => fixture(async ({ app }) => {
  assert.equal((await invoke(app, '/api/recruitment/applications/anything', { method: 'GET' })).status, 404);
  assert.equal((await invoke(app, '/applications/anything/cv.pdf', { method: 'GET' })).status, 404);
}));
test('retention removes old dossiers but keeps recent applications', async () => fixture(async ({ app, config }) => {
  const oldKey = randomUUID(), freshKey = randomUUID(); await invoke(app, undefined, { data: form({ key: oldKey }) }); await invoke(app, undefined, { data: form({ key: freshKey }) });
  const old = await readRecord(config, oldKey); old.receivedAt = new Date(Date.now() - 181 * 86400000).toISOString(); await atomicJson(join(applicationDirectory(config, oldKey), 'record.json'), old);
  assert.equal((await cleanOldApplications(config)).removed, 1); assert.equal(await readRecord(config, oldKey), null); assert.ok(await readRecord(config, freshKey));
}));
test('SMTP and private storage configuration cannot disable TLS or use the public repository', () => {
  assert.equal(configuration({ ...envFor('/tmp/private-test'), SMTP_PORT: '465', SMTP_SECURE: 'false' }).smtpConfigured, false);
  assert.equal(configuration({ ...envFor('/tmp/private-test'), SMTP_PORT: '587', SMTP_SECURE: 'false' }).smtp.tls.rejectUnauthorized, true);
  assert.throws(() => configuration({ ...envFor('/workspace/cashpay-main/var') }), e => e.code === 'PRIVATE_STORAGE_REQUIRED');
});
