'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { compareSmtp, loadSourceEnvironment, readApps } = require('../compare-smtp');
const secret = 'synthetic-reference-$private#only';
const account = { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'noreply@example.com', SMTP_PASSWORD: secret };
const missing = () => { throw Object.assign(new Error(), { code: 'ENOENT' }); };
const apps = [{ name: 'cashpay-wallet', pm2_env: { pm_cwd: '/fixture' }, confidential: secret }];

test('comparison authenticates the selected source once, never sends, and reveals only password equality', async () => {
    let verifies = 0, sends = 0;
    const report = await compareSmtp(undefined, { env: account, getApps: () => apps, loadSource: () => account, readFileSync: missing,
        transportFactory: options => {
            assert.equal(options.auth.pass, secret); assert.equal(options.secure, true);
            return { async verify() { verifies++; }, async sendMail() { sends++; }, close() {} };
        } });
    assert.equal(report.ok, true); assert.equal(report.matched.password, true);
    assert.equal(verifies, 1); assert.equal(sends, 0); assert.equal(report.deliveryTested, false);
    const json = JSON.stringify(report);
    assert.equal(json.includes(secret), false); assert.equal(json.includes('fingerprint'), false); assert.equal(json.includes('length'), false);
});
test('different career password is reported without reusing it for reference authentication', async () => {
    const report = await compareSmtp('cashpay-wallet', { env: { ...account, SMTP_PASSWORD: 'another fixture' }, getApps: () => apps,
        loadSource: () => account, readFileSync: missing, transportFactory: options => {
            assert.equal(options.auth.pass, secret); return { async verify() {}, close() {} };
        } });
    assert.equal(report.ok, false); assert.equal(report.source.ok, true); assert.equal(report.matched.password, false);
    assert.equal(JSON.stringify(report).includes('another fixture'), false);
});
test('missing app reports names only, without probing credentials or another source', async () => {
    const report = await compareSmtp('unknown', { getApps: () => apps, loadSource: () => { throw Error('must not load'); } });
    assert.deepEqual(report.availableApps, ['cashpay-wallet']); assert.equal(report.error.code, 'PM2_APP_NOT_FOUND');
    assert.equal(JSON.stringify(report).includes(secret), false);
});
test('loader absence and PM2 failures never expose raw output or fall back to a custom parser', async () => {
    const report = await compareSmtp(undefined, { getApps: () => apps, loadSource: () => { throw Object.assign(Error(secret), { code: 'NEXT_ENV_LOADER_UNAVAILABLE' }); } });
    assert.equal(report.error.code, 'NEXT_ENV_LOADER_UNAVAILABLE'); assert.equal(JSON.stringify(report).includes(secret), false);
    assert.throws(() => readApps({ execute: () => { throw Object.assign(Error(secret), { stdout: secret, stderr: secret }); } }), error => error.code === 'PM2_LIST_UNAVAILABLE' && !error.message.includes(secret));
});
test('source SMTP refusal exposes safe codes and does not echo authentication payloads', async () => {
    const report = await compareSmtp(undefined, { env: account, getApps: () => apps, loadSource: () => account, readFileSync: missing,
        transportFactory: () => ({ async verify() { throw Object.assign(Error(secret), { code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN ' + secret }); }, close() {} }) });
    assert.equal(report.ok, false); assert.deepEqual(report.source.error, { code: 'EAUTH', responseCode: 535 });
    assert.equal(JSON.stringify(report).includes(secret), false);
});
test('isolated helper uses the installed loader, preserves PM2 priority, and does not mutate parent env', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-next-compare-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const loaderDir = path.join(dir, 'node_modules', '@next', 'env'); fs.mkdirSync(loaderDir, { recursive: true });
    fs.writeFileSync(path.join(loaderDir, 'index.js'), `exports.loadEnvConfig=(cwd,dev,logger,force)=>{
        if(dev!==false || !force || process.env.NODE_ENV!=='production') throw Error('wrong mode');
        if(process.env.NODE_OPTIONS || process.env.PARENT_ONLY_FIXTURE) throw Error('parent leaked');
        const combinedEnv={SMTP_HOST:'smtp.example.com',SMTP_PORT:'465',SMTP_USER:'file@example.com',SMTP_PASSWORD:'file fixture',...process.env};
        return {combinedEnv};
    };`);
    const before = process.env.PARENT_ONLY_FIXTURE; process.env.PARENT_ONLY_FIXTURE = 'parent private';
    t.after(() => { if (before === undefined) delete process.env.PARENT_ONLY_FIXTURE; else process.env.PARENT_ONLY_FIXTURE = before; });
    // Execute the exact child helper in a separate VM: this sandbox restricts
    // spawning Node children. No real PM2 process or SMTP account is involved.
    const execute = (binary, args, options) => {
        assert.equal(binary, process.execPath); assert.equal(options.timeout, 10000);
        assert.equal(args.join(' ').includes(secret), false);
        let output = '';
        const childProcess = { env: { ...options.env }, stdout: { write(text) { output += text; } } };
        const loaderScope = { exports: {}, process: childProcess };
        vm.runInNewContext(fs.readFileSync(path.join(loaderDir, 'index.js'), 'utf8'), loaderScope);
        const requireInChild = name => name === 'node:fs' ? { readFileSync(fd) { assert.equal(fd, 0); return options.input; } }
            : (assert.equal(name, path.join(loaderDir, 'index.js')), loaderScope.exports);
        vm.runInNewContext(args[1], { process: childProcess, require: requireInChild });
        assert.equal(childProcess.exitCode, undefined);
        return output;
    };
    const result = loadSourceEnvironment({ pm2_env: { pm_cwd: dir, env: { SMTP_PASSWORD: 'nested fixture' }, SMTP_PASSWORD: secret,
        SMTP_USER: 'pm2@example.com', NODE_OPTIONS: '--require /invalid/preload' } }, { execute });
    assert.equal(result.SMTP_PASSWORD, secret); assert.equal(result.SMTP_USER, 'pm2@example.com');
    assert.equal(result.SMTP_HOST, 'smtp.example.com'); assert.equal(process.env.PARENT_ONLY_FIXTURE, 'parent private');
});
test('invalid source host and missing passwords cannot be displayed as matched credentials', async () => {
    const report = await compareSmtp(undefined, { env: {}, getApps: () => apps,
        loadSource: () => ({ SMTP_HOST: 'smtp://private@example.com', SMTP_USER: 'user@example.com' }), readFileSync: missing,
        transportFactory: () => { throw Error('invalid account must not connect'); } });
    assert.equal(report.matched.password, null); assert.equal(report.source.host, null); assert.equal(report.source.configured, false);
    assert.equal(JSON.stringify(report).includes('smtp://private'), false);
});
