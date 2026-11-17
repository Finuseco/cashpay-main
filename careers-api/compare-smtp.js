#!/usr/bin/env node
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { isIP } = require('node:net');
const { loadConfiguration } = require('./config');
const { runCheck, bareMailbox } = require('./check-mail');

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_PASS'];
const fail = code => Object.assign(new Error(), { code });
const safeName = name => typeof name === 'string' && /^[\w.-]{1,100}$/.test(name) ? name : '[nom non affiché]';
const present = value => value !== undefined && value !== null && value !== '';
const equal = (a, b) => present(a) && present(b) ? a === b : null;
function safeAccount(account) {
    const host = typeof account.host === 'string' && account.host.length <= 253 &&
        (isIP(account.host) || /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(account.host)) ? account.host : null;
    return { host, port: Number.isInteger(account.port) && account.port >= 1 && account.port <= 65535 ? account.port : null,
        user: bareMailbox(account.user) || (account.user ? '[compte configuré]' : null) };
}
function readApps({ execute = execFileSync } = {}) {
    try {
        const apps = JSON.parse(execute('pm2', ['jlist'], { encoding: 'utf8', timeout: 10000, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
        if (!Array.isArray(apps)) throw Error();
        return apps;
    } catch (_) { throw fail('PM2_LIST_UNAVAILABLE'); }
}
const SOURCE_HELPER = `
'use strict';
try {
    const input = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, input.environment, { NODE_ENV: 'production' });
    delete process.env.NODE_OPTIONS;
    delete process.env.NODE_PATH;
    const loader = require(input.loader);
    const loaded = loader.loadEnvConfig(input.cwd, false, { info() {}, error() {} }, true);
    const env = loaded.combinedEnv || process.env;
    const values = {};
    for (const key of ${JSON.stringify(SMTP_KEYS)}) if (typeof env[key] === 'string') values[key] = env[key];
    process.stdout.write(JSON.stringify(values));
} catch (_) { process.exitCode = 1; }
`;

/** Reconstruct production configuration with the application's installed Next loader.
 * Secrets travel only through captured pipes, never arguments, reports or errors.
 * This does not read process.env inside the already-running application.
 */
function loadSourceEnvironment(app, { execute = execFileSync, resolveModule = require.resolve } = {}) {
    const pm = app && app.pm2_env || {};
    const cwd = pm.pm_cwd;
    if (typeof cwd !== 'string' || !path.isAbsolute(cwd) || /[\r\n\u0000]/.test(cwd)) throw fail('SOURCE_DIRECTORY_UNAVAILABLE');
    let loader;
    try { loader = resolveModule('@next/env', { paths: [cwd] }); }
    catch (_) { throw fail('NEXT_ENV_LOADER_UNAVAILABLE'); }
    const environment = {};
    for (const values of [pm.env || {}, pm]) for (const [key, value] of Object.entries(values)) {
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && typeof value === 'string' && key !== 'NODE_OPTIONS' && key !== 'NODE_PATH') environment[key] = value;
    }
    try {
        const output = execute(process.execPath, ['-e', SOURCE_HELPER], { cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
            env: { NODE_ENV: 'production' }, input: JSON.stringify({ cwd, loader, environment }), stdio: ['pipe', 'pipe', 'pipe'] });
        const values = JSON.parse(output);
        if (!values || typeof values !== 'object' || Array.isArray(values)) throw Error();
        return Object.fromEntries(SMTP_KEYS.filter(key => typeof values[key] === 'string').map(key => [key, values[key]]));
    } catch (_) { throw fail('SOURCE_CONFIGURATION_UNAVAILABLE'); }
}

/** Compare one selected reference application; authenticate once without sending. */
async function compareSmtp(appName = 'cashpay-wallet', { env = process.env, getApps = readApps,
    loadSource = loadSourceEnvironment, readFileSync, transportFactory } = {}) {
    const report = { service: 'cashpay-careers', readOnly: true, deliveryTested: false,
        source: { app: safeName(appName), configuration: 'pm2_start_environment_and_current_next_production_files' } };
    let apps;
    try { apps = await getApps(); if (!Array.isArray(apps)) throw Error(); }
    catch (_) { return { ...report, ok: false, error: { code: 'PM2_LIST_UNAVAILABLE' } }; }
    const app = apps.find(entry => entry.name === appName);
    if (!app) return { ...report, ok: false, error: { code: 'PM2_APP_NOT_FOUND' }, availableApps: apps.map(entry => safeName(entry.name)) };
    let reference;
    try { reference = await loadSource(app); }
    catch (error) {
        const codes = new Set(['SOURCE_DIRECTORY_UNAVAILABLE', 'NEXT_ENV_LOADER_UNAVAILABLE', 'SOURCE_CONFIGURATION_UNAVAILABLE']);
        return { ...report, ok: false, error: { code: codes.has(error && error.code) ? error.code : 'SOURCE_CONFIGURATION_UNAVAILABLE' } };
    }
    const smtpEnv = Object.fromEntries(SMTP_KEYS.filter(key => typeof reference[key] === 'string').map(key => [key, reference[key]]));
    const absent = () => { throw Object.assign(new Error(), { code: 'ENOENT' }); };
    const sourceConfig = loadConfiguration({ env: smtpEnv, readFileSync: absent }).config.smtp;
    const careers = loadConfiguration({ env, ...(readFileSync ? { readFileSync } : {}) });
    const matched = Object.fromEntries(['host', 'port', 'user', 'pass'].map(key => [key === 'pass' ? 'password' : key, equal(careers.config.smtp[key], sourceConfig[key])]));
    // Only main credentials enter this check: no second dedicated ACK auth and
    // no accidental loading of the careers configuration as the reference.
    const checked = await runCheck(smtpEnv, { readFileSync: absent, transportFactory });
    return { ...report, ok: checked.internal.ok && Object.values(matched).every(value => value === true),
        matched, source: { ...report.source, ...checked.internal },
        careers: { ...safeAccount(careers.config.smtp), configuration: careers.provenance } };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args[0] && !/^[\w.-]{1,100}$/.test(args[0]))) {
        console.error('Usage : node careers-api/compare-smtp.js [nom-application-pm2]'); process.exitCode = 2;
    } else compareSmtp(args[0]).then(report => {
        console.log(JSON.stringify(report, null, 2)); process.exitCode = report.ok ? 0 : 1;
    }).catch(() => {
        console.log(JSON.stringify({ ok: false, error: { code: 'COMPARISON_UNAVAILABLE' } })); process.exitCode = 2;
    });
}
module.exports = { compareSmtp, loadSourceEnvironment, readApps };
