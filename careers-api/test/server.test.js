'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { createService } = require('../server');

const jobs = { countries: [{ code: 'CD', name: 'RDC', provinces: ['Kinshasa'] }], positions: [{ key: 'manager', fr: 'Manager', en: 'Manager' }] };
function fixture(t, { reject = false, blockedStorage = false, dbError = false, acknowledgementFails = false } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'careers-http-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const dataDir = path.join(root, 'applications');
    if (blockedStorage) fs.writeFileSync(dataDir, 'occupied');
    const messages = [];
    const server = createService({ env: { CAREERS_ENV_FILE: path.join(root, 'absent'), DATA_DIR: dataDir, SMTP_HOST: 'smtp.example.test', SMTP_USER: 'info@example.test', SMTP_PASSWORD: 'synthetic-test-value', MAIL_TO: 'hr@example.test' }, jobs,
        logger: { log() {}, error() {}, warn() {} },
        db: { enabled: () => false, saveApplication: async () => { if (dbError) throw Error('database offline'); return null; }, logMail: async () => {} },
        transportFactory: () => ({ sendMail: async message => {
            messages.push(message);
            if (acknowledgementFails && message.to.includes('applicant@example.test')) throw Object.assign(Error('refused'), { code: 'EENVELOPE' });
            return { accepted: reject ? [] : message.to, rejected: reject ? message.to : [] };
        } })
    });
    t.after(() => server.emit('close'));
    return { server, dataDir, messages };
}
async function submit(server, overrides = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ country: 'CD', province: 'Kinshasa', position: 'manager', lastName: 'Applicant', firstName: 'Test', gender: 'F', profession: 'Manager', age: '30', phone: '+243850000000', email: 'applicant@example.test', consent: '1', t: String(Date.now() - 10000), ...overrides })) form.set(key, value);
    form.set('photo', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])], { type: 'image/png' }), 'photo.png');
    form.set('cv', new Blob(['%PDF-1.4 test CV'], { type: 'application/pdf' }), 'cv.pdf');
    const encoded = new Request('http://localhost/api/careers', { method: 'POST', body: form });
    const bytes = Buffer.from(await encoded.arrayBuffer());
    return invoke(server, { method: 'POST', url: '/api/careers', headers: { 'content-type': encoded.headers.get('content-type'), 'content-length': String(bytes.length) } }, bytes);
}
function invoke(server, options, body = Buffer.alloc(0)) {
    return new Promise((resolve, reject) => {
        const req = Readable.from([body]);
        Object.assign(req, options, { socket: { remoteAddress: '127.0.0.1' } });
        let status, headers;
        const timer = setTimeout(() => reject(Error('request did not finish')), 2000);
        server.handleRequest(req, { writeHead(code, values) { status = code; headers = values; }, end(text) { clearTimeout(timer); resolve({ status, headers, body: JSON.parse(text) }); } });
    });
}
test('SMTP refusal produces 202 with a saved dossier and pending delivery, not sent success', async t => {
    const { server, dataDir } = fixture(t, { reject: true });
    const response = await submit(server);
    assert.equal(response.status, 202);
    assert.equal(response.body.saved, true);
    assert.deepEqual(response.body.delivery, { internal: 'pending', acknowledgement: 'pending' });
    const dir = path.join(dataDir, new Date().toISOString().slice(0, 7), response.body.ref);
    const application = JSON.parse(fs.readFileSync(path.join(dir, 'candidature.json')));
    assert.equal(application.email, 'applicant@example.test');
    assert.equal(application.files.length, 2);
    for (const name of application.files) assert.ok(fs.statSync(path.join(dir, name)).size > 0);
    const state = JSON.parse(fs.readFileSync(path.join(dir, 'mail-delivery.json')));
    assert.equal(state.internal.lastError.code, 'RECIPIENT_NOT_ACCEPTED');
});
test('accepted recipients produce explicit delivery results and carry CV, photo and reply address', async t => {
    const { server, messages } = fixture(t, { dbError: true });
    const response = await submit(server);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.delivery, { internal: 'accepted', acknowledgement: 'accepted' });
    const internal = messages.find(message => message.to.includes('hr@example.test'));
    assert.equal(internal.replyTo.address, 'applicant@example.test');
    assert.deepEqual(internal.attachments.map(file => file.filename), ['Photo_photo.png', 'CV_cv.pdf']);
    assert.equal(internal.attachments[0].cid, 'photo@cashpay');
});
test('internal acceptance remains distinct from acknowledgement rejection', async t => {
    const { server } = fixture(t, { acknowledgementFails: true });
    const response = await submit(server);
    assert.equal(response.status, 200);
    assert.equal(response.body.delivery.internal, 'accepted');
    assert.equal(response.body.delivery.acknowledgement, 'pending');
});
test('failed storage and refused internal mail produce 503 and saved=false', async t => {
    const { server } = fixture(t, { reject: true, blockedStorage: true });
    const response = await submit(server);
    assert.equal(response.status, 503);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.saved, false);
    assert.equal(response.body.error, 'mail_unavailable');
    assert.equal(response.body.delivery.internal, 'failed');
});
test('health describes configuration without trying SMTP or claiming verification', async t => {
    const { server, messages } = fixture(t);
    const response = await invoke(server, { method: 'GET', url: '/api/careers/health', headers: {} });
    assert.equal(response.status, 200);
    assert.equal(response.body.smtpConfigured, true);
    assert.equal(response.body.smtpVerified, false);
    assert.equal(response.body.smtpStatus, 'configuration_only');
    assert.equal(messages.length, 0);
    assert.ok(!JSON.stringify(response.body).includes('synthetic-test-value'));
});
test('honeypot response never reports a fictitious successful application', async t => {
    const { server, messages } = fixture(t);
    const response = await submit(server, { website: 'spam' });
    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);
    assert.equal(messages.length, 0);
});
