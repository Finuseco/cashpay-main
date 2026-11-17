'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDelivery } = require('../mail-delivery');

async function withFixture(run, { config: override = {}, sendMail, logMail } = {}) {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cashpay-mail-delivery-'));
    const config = {
        dataDir, mailTo: 'info@cashpay-all.com', mailFrom: 'noreply@cashpay-all.com', noreplyFrom: 'noreply@cashpay-all.com',
        smtp: { host: 'smtp.example.invalid', port: 587, user: 'noreply@cashpay-all.com', pass: 'synthetic-SMTP-secret' },
        noreply: { host: 'smtp.example.invalid', port: 587, user: '', pass: '' }, ...override
    };
    let now = Date.parse('2026-11-17T10:00:00Z');
    const messages = [], factories = [], journal = [], logs = [];
    const ref = 'CP-261117-ABCDEF', dir = path.join(dataDir, '2026-11', ref);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const d = { lastName: 'Test', firstName: 'Candidate', email: 'candidate@example.invalid', country: 'CD', province: 'Kinshasa', gender: 'F', profession: 'Comptable', age: 30, phone: '+243812345678', city: 'Kinshasa', message: 'Candidature de test automatisé.', lang: 'fr' };
    const files = [{ name: 'CV_test.pdf', buf: Buffer.from('%PDF-1.4\nSynthetic test document\n') }];
    const context = { ref, position: 'Expert-comptable', positionEn: 'Accountant', country: 'RDC', resultsDate: '1 décembre 2026', files: files.map(file => file.name) };
    const application = { d, context, appId: 42, files, dir };
    const writeDossier = (target, data = d) => {
        fs.mkdirSync(target, { recursive: true, mode: 0o700 });
        fs.writeFileSync(path.join(target, 'candidature.json'), JSON.stringify({ ...data, files: files.map(file => file.name) }));
        for (const file of files) fs.writeFileSync(path.join(target, file.name), file.buf);
    };
    writeDossier(dir);
    const delivery = createDelivery(config, {
        clock: () => now,
        logger: { log(message) { logs.push(message); }, error(message) { logs.push(message); } },
        db: { async logMail(...args) { journal.push(args); if (logMail) await logMail(fixture, ...args); } },
        transportFactory(options, account) {
            factories.push({ options, account });
            return { async sendMail(message) {
                const kind = message.messageId.includes('.internal@') ? 'internal' : 'acknowledgement';
                messages.push({ account, kind, message });
                return sendMail ? sendMail(message, kind, account, messages) : { accepted: message.to, rejected: [], messageId: message.messageId };
            }, close() {} };
        }
    });
    const fixture = {
        config, ref, dir, application, delivery, messages, factories, journal, logs, writeDossier,
        get now() { return now; }, set now(value) { now = value; },
        readState() { return JSON.parse(fs.readFileSync(path.join(dir, 'mail-delivery.json'), 'utf8')); }
    };
    try { await run(fixture); }
    finally { delivery.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
}

test('delivery confirms explicit recipient acceptance, keeps private state, and does not resend accepted messages', async () => withFixture(async f => {
    const state = await f.delivery.sendApplication(f.application);
    assert.equal(state.internal.status, 'accepted'); assert.equal(state.acknowledgement.status, 'accepted');
    assert.equal(f.messages.length, 2);
    const internal = f.messages.find(item => item.kind === 'internal').message;
    assert.deepEqual(internal.to, ['info@cashpay-all.com']);
    assert.equal(internal.attachments[0].filename, 'CV_test.pdf');
    assert.ok(Buffer.isBuffer(internal.attachments[0].content));
    assert.equal(internal.replyTo.address, 'candidate@example.invalid');
    assert.equal(f.readState().version, 1);
    assert.equal(fs.statSync(path.join(f.dir, 'mail-delivery.json')).mode & 0o777, 0o600);
    await f.delivery.sendApplication(f.application);
    f.now += 86400000;
    assert.equal((await f.delivery.retryPending()).processed, 0);
    assert.equal(f.messages.length, 2);
    assert.equal(f.journal.filter(row => row[3] === true).length, 2);
}));

test('a resolved sendMail promise without the intended accepted recipient is not success', async () => {
    for (const internalAccepted of [[], ['unrelated@example.invalid']]) {
        await withFixture(async f => {
            const state = await f.delivery.sendApplication(f.application);
            assert.equal(state.internal.status, 'pending');
            assert.equal(state.internal.lastError.code, 'RECIPIENT_NOT_ACCEPTED');
            assert.deepEqual(state.internal.acceptedRecipients, []);
            assert.equal(state.acknowledgement.status, 'accepted');
            assert.equal(f.delivery.lastMail.internal.ok, false);
            assert.equal(f.journal.find(row => row[1] === 'internal')[3], false);
        }, { sendMail(message, kind) { return { accepted: kind === 'internal' ? internalAccepted : message.to, rejected: kind === 'internal' ? message.to : [] }; } });
    }
});

test('partial multi-recipient rejection retries only the still-unaccepted mailbox', async () => {
    let internalCalls = 0;
    await withFixture(async f => {
        const initial = await f.delivery.sendApplication(f.application);
        assert.equal(initial.internal.status, 'pending');
        assert.deepEqual(initial.internal.acceptedRecipients, ['info@cashpay-all.com']);
        assert.deepEqual(f.messages[0].message.to, ['info@cashpay-all.com', 'hr@cashpay-all.com']);
        f.now = Date.parse(initial.internal.nextAttemptAt);
        assert.equal((await f.delivery.retryPending()).processed, 1);
        const retried = f.messages.filter(item => item.kind === 'internal')[1];
        assert.deepEqual(retried.message.to, ['hr@cashpay-all.com']);
        assert.equal(f.readState().internal.status, 'accepted');
        assert.equal(f.messages.filter(item => item.kind === 'acknowledgement').length, 1);
        f.now += 86400000;
        assert.equal((await f.delivery.retryPending()).processed, 0);
        assert.equal(internalCalls, 2);
    }, { config: { mailTo: 'info@cashpay-all.com, hr@cashpay-all.com' }, sendMail(message, kind) {
        if (kind === 'internal' && ++internalCalls === 1) return { accepted: ['INFO@CASHPAY-ALL.COM'], rejected: ['hr@cashpay-all.com'] };
        return { accepted: message.to, rejected: [] };
    } });
});

test('a dedicated acknowledgement account works even when the main transport is absent', async () => withFixture(async f => {
    const state = await f.delivery.sendApplication(f.application);
    assert.equal(state.internal.status, 'pending');
    assert.equal(state.internal.lastError.code, 'SMTP_NOT_CONFIGURED');
    assert.equal(state.acknowledgement.status, 'accepted');
    assert.deepEqual(f.factories.map(item => item.account), ['noreply']);
    assert.equal(f.messages.length, 1); assert.equal(f.messages[0].kind, 'acknowledgement');
    assert.deepEqual(f.messages[0].message.to, ['candidate@example.invalid']);
}, { config: {
    smtp: { host: '', port: 587, user: '', pass: '' },
    noreply: { host: 'smtp.example.invalid', port: 465, user: 'noreply@cashpay-all.com', pass: 'synthetic-dedicated-secret' }
} }));

test('SMTP diagnostics retain safe codes while excluding credentials and provider messages', async () => withFixture(async f => {
    const state = await f.delivery.sendApplication(f.application);
    const persisted = fs.readFileSync(path.join(f.dir, 'mail-delivery.json'), 'utf8');
    const observable = JSON.stringify({ state, journal: f.journal, logs: f.logs, lastMail: f.delivery.lastMail }) + persisted;
    for (const secret of ['synthetic-SMTP-secret', 'PRIVATE_PROVIDER_MESSAGE', 'LOGIN_PAYLOAD_SECRET']) assert.equal(observable.includes(secret), false);
    assert.deepEqual(state.internal.lastError, { code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN' });
    assert.equal(state.internal.status, 'pending');
}, { sendMail() { throw Object.assign(new Error('PRIVATE_PROVIDER_MESSAGE password=synthetic-SMTP-secret'), { code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN', response: 'LOGIN_PAYLOAD_SECRET' }); } }));

test('the outbox respects retry backoff and stops after eight actual send attempts', async () => {
    let internalCalls = 0;
    await withFixture(async f => {
        let state = await f.delivery.sendApplication(f.application);
        assert.equal(state.internal.attempts, 1);
        f.now = Date.parse(state.internal.nextAttemptAt) - 1;
        assert.equal((await f.delivery.retryPending()).processed, 0); assert.equal(internalCalls, 1);
        while (state.internal.attempts < 8) {
            f.now = Date.parse(state.internal.nextAttemptAt);
            assert.equal((await f.delivery.retryPending()).processed, 1);
            state = f.readState();
        }
        assert.equal(internalCalls, 8); assert.equal(state.internal.needsReview, true);
        assert.equal(f.messages.filter(item => item.kind === 'acknowledgement').length, 1);
        f.now += 7 * 86400000;
        assert.equal((await f.delivery.retryPending()).processed, 0);
        await f.delivery.sendApplication(f.application);
        assert.equal(internalCalls, 8);
    }, { sendMail(message, kind) {
        if (kind === 'internal') { internalCalls++; throw Object.assign(new Error('Temporary delivery failure'), { code: 'ETIMEDOUT' }); }
        return { accepted: message.to, rejected: [] };
    } });
});

test('disk retry only processes version-one markers matching their dossier reference', async () => withFixture(async f => {
    const pending = () => ({ status: 'pending', attempts: 0, acceptedRecipients: [], nextAttemptAt: null });
    const cases = [
        { ref: f.ref, state: { version: 0, ref: f.ref, context: f.application.context } },
        { ref: 'CP-261117-ABCDEF12', state: { version: 1, ref: 'CP-261117-000000', context: { ...f.application.context, ref: 'CP-261117-ABCDEF12' } } }
    ];
    for (const item of cases) {
        const dir = path.join(f.config.dataDir, '2026-11', item.ref); f.writeDossier(dir);
        fs.writeFileSync(path.join(dir, 'mail-delivery.json'), JSON.stringify({ ...item.state, internal: pending(), acknowledgement: pending() }));
    }
    assert.equal((await f.delivery.retryPending()).processed, 0);
    assert.equal(f.messages.length, 0);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.dir, 'mail-delivery.json'), 'utf8')).version, 0);
}));

test('a failed outbox write cannot promise a durable retry and logs the reference', async () => withFixture(async f => {
    fs.mkdirSync(path.join(f.dir, 'mail-delivery.json'));
    const outcome = await f.delivery.sendApplication(f.application);
    assert.equal(outcome.internal.status, 'pending');
    assert.equal(outcome.retryScheduled, false);
    assert.ok(f.logs.some(line => line.includes(f.ref) && /non sauvegard[ée]|persistence.*(?:fail|impossible)|outbox.*(?:fail|impossible)/i.test(line)), 'a persistence failure must be logged with the dossier reference');
    assert.equal((await f.delivery.retryPending()).processed, 0);
}, { sendMail(message, kind) { return { accepted: kind === 'internal' ? [] : message.to, rejected: kind === 'internal' ? message.to : [] }; } }));

test('accepted mail state is durable before asynchronous database journaling begins', async () => {
    const checked = [];
    await withFixture(async f => {
        const outcome = await f.delivery.sendApplication(f.application);
        assert.equal(outcome.internal.status, 'accepted');
        assert.equal(outcome.acknowledgement.status, 'accepted');
        assert.deepEqual(checked.sort(), ['acknowledgement', 'internal']);
    }, { async logMail(f, appId, kind, to, accepted) {
        if (!accepted) return;
        const persisted = f.readState();
        assert.equal(persisted[kind].status, 'accepted', 'the accepted role must be saved before the database operation can delay or fail');
        assert.ok(persisted[kind].acceptedRecipients.length > 0);
        checked.push(kind);
        await new Promise(resolve => setImmediate(resolve));
    } });
});
