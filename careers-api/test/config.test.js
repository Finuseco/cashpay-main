'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfiguration } = require('../config');
const { runCheck, bareMailbox } = require('../check-mail');
const missingFile = () => { throw Object.assign(new Error('not present'), { code: 'ENOENT' }); };
const fixtureFile = content => () => content;

test('service mail file wins over stale PM2 mail variables without changing the supplied environment', () => {
    const env = Object.freeze({ SMTP_HOST: 'old.example', SMTP_USER: 'old@example.com', SMTP_PASSWORD: 'old fixture only', PORT: '8019', DB_HOST: 'existing-db', CAREERS_ENV_FILE: '/fixture/careers.env' });
    const result = loadConfiguration({ env, readFileSync: fixtureFile("SMTP_HOST=smtp.example.com\nSMTP_USER=current@example.com\nSMTP_PASSWORD='new fixture $literal #value'\nPORT=8020\nDB_HOST=file-db\nDB_NAME=careers\n") });
    assert.equal(result.config.smtp.host, 'smtp.example.com');
    assert.equal(result.config.smtp.pass, 'new fixture $literal #value');
    assert.equal(result.config.port, 8019);
    assert.equal(result.effectiveEnv.DB_HOST, 'existing-db');
    assert.equal(result.effectiveEnv.DB_NAME, 'careers');
    assert.equal(env.SMTP_PASSWORD, 'old fixture only');
    assert.equal(env.DB_NAME, undefined);
    assert.equal(result.provenance.fields.SMTP_HOST, 'file');
    assert.equal(result.provenance.fields.SMTP_PASSWORD, 'file');
    assert.equal(result.provenance.envFileLoaded, true);
});

test('explicit process priority preserves existing environment credentials', () => {
    const result = loadConfiguration({ env: { CAREERS_ENV_PRIORITY: 'process', SMTP_USER: 'runtime@example.com', SMTP_PASSWORD: 'runtime only' }, readFileSync: fixtureFile("SMTP_USER=file@example.com\nSMTP_PASSWORD='file only'\nSMTP_HOST=smtp.example.com\n") });
    assert.equal(result.config.smtp.user, 'runtime@example.com');
    assert.equal(result.config.smtp.pass, 'runtime only');
    assert.equal(result.config.smtp.host, 'smtp.example.com');
    assert.equal(result.provenance.fields.SMTP_PASSWORD, 'process');
    assert.equal(result.provenance.mailPriority, 'process');
});

test('literal quoted passwords and password aliases retain their characters', () => {
    const result = loadConfiguration({ env: {}, readFileSync: fixtureFile("SMTP_USER=main@example.com\nSMTP_PASS='fixture$DOLLAR#hash\\slash'\nNOREPLY_SMTP_HOST=mail.example.com\nNOREPLY_SMTP_USER=ack@example.com\nNOREPLY_SMTP_PASS='ack$fixture#only'\n") });
    assert.equal(result.config.smtp.pass, 'fixture$DOLLAR#hash\\slash');
    assert.equal(result.config.noreply.pass, 'ack$fixture#only');
    assert.equal(result.config.noreplyFrom, 'ack@example.com');
    assert.equal(result.provenance.fields.SMTP_PASSWORD, 'file');
    assert.equal(result.provenance.aliases.SMTP_PASSWORD, 'SMTP_PASS');
    const canonical = loadConfiguration({ env: { SMTP_PASSWORD: 'canonical', SMTP_PASS: 'alias' }, readFileSync: missingFile });
    assert.equal(canonical.config.smtp.pass, 'canonical');
});

test('password aliases obey source priority before canonical key preference', () => {
    const env = Object.freeze({ SMTP_PASSWORD: 'stale canonical', NOREPLY_SMTP_PASSWORD: 'stale acknowledgement' });
    const result = loadConfiguration({ env, readFileSync: fixtureFile("SMTP_PASS='current file alias'\nNOREPLY_SMTP_PASS='current acknowledgement alias'\n") });
    assert.equal(result.config.smtp.pass, 'current file alias');
    assert.equal(result.config.noreply.pass, 'current acknowledgement alias');
    assert.equal(result.provenance.fields.SMTP_PASSWORD, 'file');
    assert.equal(result.provenance.aliases.SMTP_PASSWORD, 'SMTP_PASS');
    assert.equal(env.SMTP_PASSWORD, 'stale canonical');
    const processPriority = loadConfiguration({ env: { CAREERS_ENV_PRIORITY: 'process', SMTP_PASS: 'runtime alias' }, readFileSync: fixtureFile("SMTP_PASSWORD='file canonical'\n") });
    assert.equal(processPriority.config.smtp.pass, 'runtime alias');
    assert.equal(processPriority.provenance.fields.SMTP_PASSWORD, 'process');
    const emptyCanonical = loadConfiguration({ env: {}, readFileSync: fixtureFile("SMTP_PASSWORD=\nSMTP_PASS='do not silently substitute'\n") });
    assert.equal(emptyCanonical.config.smtp.pass, '');
});

test('configuration read failures expose a known code without exception contents', () => {
    const secret = 'PRIVATE_FIXTURE';
    const result = loadConfiguration({ env: {}, readFileSync: () => { throw Object.assign(new Error(secret), { code: secret }); } });
    assert.equal(result.provenance.readErrorCode, 'ENV_READ_FAILED');
    assert.equal(JSON.stringify(result).includes(secret), false);
});

test('missing configuration is reported without importing a transport or sending anything', async () => {
    let factoryCalls = 0;
    const result = await runCheck({}, { readFileSync: missingFile, transportFactory: () => { factoryCalls++; throw Error('must not load'); } });
    assert.equal(result.ok, false);
    assert.equal(result.internal.configured, false);
    assert.equal(result.configuration.readErrorCode, 'ENOENT');
    assert.equal(factoryCalls, 0);
    assert.equal(result.deliveryTested, false);
});

test('shared SMTP is verified once and no message or secret appears in the diagnostic', async () => {
    const secret = 'synthetic fixture password $private';
    let verifications = 0, sends = 0, closed = 0;
    const result = await runCheck({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'auth@example.com', SMTP_PASSWORD: secret, MAIL_FROM: 'CashPay <auth@example.com>', MAIL_NOREPLY: 'alias@example.com' }, {
        readFileSync: missingFile,
        transportFactory: options => {
            assert.equal(options.auth.pass, secret); assert.equal(options.requireTLS, true); assert.equal(options.tls.rejectUnauthorized, true); assert.equal(options.connectionTimeout, 10000);
            return { async verify() { verifications++; }, async sendMail() { sends++; }, close() { closed++; } };
        }
    });
    assert.equal(result.ok, true); assert.equal(verifications, 1); assert.equal(sends, 0); assert.equal(closed, 1);
    assert.equal(result.acknowledgement.mode, 'shared');
    assert.equal(result.warnings[0].code, 'FROM_DIFFERS_FROM_AUTH');
    assert.equal(JSON.stringify(result).includes(secret), false);
    assert.equal(result.checks, 'smtp_authentication_only');
});

test('dedicated acknowledgement account is verified independently of a missing principal account', async () => {
    const seen = [];
    const result = await runCheck({ NOREPLY_SMTP_HOST: 'smtp.example.com', NOREPLY_SMTP_PORT: '465', NOREPLY_SMTP_USER: 'ack@example.com', NOREPLY_SMTP_PASSWORD: 'ack fixture' }, {
        readFileSync: missingFile,
        transportFactory: options => { seen.push(options); return { async verify() {}, close() {} }; }
    });
    assert.equal(result.internal.ok, false); assert.equal(result.acknowledgement.ok, true);
    assert.equal(result.acknowledgement.mode, 'dedicated');
    assert.equal(result.addresses.acknowledgementFrom, 'ack@example.com');
    assert.equal(seen.length, 1); assert.equal(seen[0].secure, true);
});

test('provider exceptions expose only bounded SMTP codes, never messages or AUTH payloads', async () => {
    const secret = 'private fixture should never appear';
    const result = await runCheck({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'auth@example.com', SMTP_PASSWORD: secret }, {
        readFileSync: missingFile,
        transportFactory: () => ({ async verify() { throw Object.assign(new Error(secret), { code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN ' + secret }); }, close() {} })
    });
    assert.equal(result.ok, false);
    assert.deepEqual(result.internal.error, { code: 'EAUTH', responseCode: 535 });
    assert.equal(JSON.stringify(result).includes(secret), false);
});

test('invalid host content is never printed and mailbox parsing allows display names without header injection', async () => {
    const report = await runCheck({ SMTP_HOST: 'smtp://user:secret@example.com', SMTP_USER: 'user@example.com', SMTP_PASSWORD: 'fixture' }, { readFileSync: missingFile, transportFactory: () => { throw Error('not called'); } });
    assert.equal(report.internal.host, null);
    assert.equal(JSON.stringify(report).includes('secret'), false);
    assert.equal(bareMailbox('CashPay Carrières <noreply@example.com>'), 'noreply@example.com');
    assert.equal(bareMailbox('noreply@example.com\r\nBcc:other@example.com'), null);
});
