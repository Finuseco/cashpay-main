'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const TPL = require('./templates');

function mailbox(value) {
    const text = String(value || '').trim();
    const match = text.match(/<([^<>]+)>$/);
    const address = match ? match[1].trim() : text;
    if (!/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/.test(address)) return null;
    return address.toLowerCase();
}
function addresses(value) {
    const list = String(value || '').split(',').map(mailbox);
    return list.length && list.every(Boolean) ? [...new Set(list)] : [];
}
function safeFailure(error) {
    return {
        code: /^[A-Z][A-Z0-9_]{0,49}$/.test(error && error.code || '') ? error.code : 'SMTP_SEND_FAILED',
        ...(Number.isInteger(error && error.responseCode) ? { responseCode: error.responseCode } : {}),
        ...(/^[A-Z][A-Z ]{0,39}$/.test(error && error.command || '') ? { command: error.command } : {})
    };
}
function writeState(dir, state) {
    if (!dir) return false;
    const tmp = path.join(dir, '.mail-' + process.pid + '-' + crypto.randomBytes(5).toString('hex'));
    try {
        fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600, flag: 'wx' });
        fs.renameSync(tmp, path.join(dir, 'mail-delivery.json'));
        return true;
    } catch (_) { try { fs.unlinkSync(tmp); } catch (_) {} return false; }
}
function roleState() { return { status: 'pending', attempts: 0, acceptedRecipients: [], nextAttemptAt: null }; }

function createDelivery(config, { transportFactory, db, logger = console, clock = Date.now } = {}) {
    const transports = new Map();
    const lastMail = { internal: null, acknowledgement: null };
    const inFlight = new Set();
    const factory = transportFactory || (options => require('nodemailer').createTransport(options));
    function persist(application, state) {
        const saved = writeState(application.dir, state);
        if (!saved && application.dir) logger.error('[careers] état de livraison non sauvegardé ref=' + state.ref);
        return saved;
    }
    function transport(kind) {
        const separate = Boolean(config.noreply.user || config.noreply.pass);
        const key = kind === 'acknowledgement' && separate ? 'noreply' : 'main';
        const smtp = key === 'noreply' ? config.noreply : config.smtp;
        if (!smtp.host || !smtp.user || !smtp.pass) throw Object.assign(new Error(), { code: key === 'main' ? 'SMTP_NOT_CONFIGURED' : 'NOREPLY_NOT_CONFIGURED' });
        if (!transports.has(key)) transports.set(key, factory({
            host: smtp.host, port: smtp.port, secure: smtp.port === 465,
            requireTLS: smtp.port !== 465, tls: { rejectUnauthorized: true },
            auth: { user: smtp.user, pass: smtp.pass },
            connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000
        }, key));
        return transports.get(key);
    }
    async function log(ref, kind, entry, appId, to) {
        logger[entry.status === 'accepted' ? 'log' : 'error']('[careers] mail ' + JSON.stringify({ ref, kind, status: entry.status, ...(entry.lastError || {}) }));
        if (db && db.logMail) {
            try { await db.logMail(appId, kind, to, entry.status === 'accepted', entry.lastError ? JSON.stringify(entry.lastError) : null); }
            catch (_) { logger.error('[careers] journal e-mail indisponible'); }
        }
    }
    async function attempt(kind, application, state) {
        const entry = state[kind], now = clock();
        const targets = kind === 'internal' ? addresses(config.mailTo) : [mailbox(application.d.email)].filter(Boolean);
        const accepted = new Set(entry.acceptedRecipients || []);
        if (targets.length && targets.every(to => accepted.has(to))) { entry.status = 'accepted'; return; }
        if (entry.attempts >= 8 || (entry.nextAttemptAt && Date.parse(entry.nextAttemptAt) > now)) return;
        let tr;
        try { tr = transport(kind); }
        catch (error) {
            entry.lastError = safeFailure(error); entry.nextAttemptAt = new Date(now + 60000).toISOString();
            lastMail[kind] = { ok: false, at: new Date(now).toISOString() };
            persist(application, state);
            await log(state.ref, kind, entry, application.appId, kind === 'internal' ? config.mailTo : application.d.email);
            return;
        }
        entry.attempts += 1;
        entry.nextAttemptAt = new Date(now + Math.min(3600000, 60000 * 2 ** (entry.attempts - 1))).toISOString();
        persist(application, state);
        try {
            const sender = mailbox(kind === 'internal' ? config.mailFrom : config.noreplyFrom);
            if (!sender || !targets.length) throw Object.assign(new Error(), { code: 'MAIL_ADDRESS_INVALID' });
            const template = kind === 'internal' ? TPL.internal(application.d, application.context) : TPL.acknowledgement(application.d, application.context);
            const messageId = '<careers.' + state.ref + '.' + kind + '@' + sender.split('@')[1] + '>';
            const info = await tr.sendMail({
                from: { name: kind === 'internal' ? 'CashPay All Carrières' : 'CashPay All', address: sender },
                to: targets.filter(to => !accepted.has(to)),
                replyTo: kind === 'internal' ? { name: application.d.firstName + ' ' + application.d.lastName, address: application.d.email } : config.mailTo,
                subject: template.subject, text: template.text, html: template.html, messageId,
                disableFileAccess: true, disableUrlAccess: true,
                ...(kind === 'internal' ? { attachments: application.files.map(file => ({ filename: file.name, content: file.buf, ...(file.name.startsWith('Photo_') ? { cid: 'photo@cashpay' } : {}) })) } : { headers: { 'Auto-Submitted': 'auto-replied', 'X-Auto-Response-Suppress': 'All' } })
            });
            for (const value of info && info.accepted || []) {
                const address = mailbox(typeof value === 'string' ? value : value.address);
                if (targets.includes(address)) accepted.add(address);
            }
            entry.acceptedRecipients = [...accepted];
            entry.status = targets.every(to => accepted.has(to)) ? 'accepted' : 'pending';
            entry.lastError = entry.status === 'accepted' ? null : { code: 'RECIPIENT_NOT_ACCEPTED' };
            entry.messageId = info && info.messageId || messageId;
            if (entry.status === 'accepted') { entry.acceptedAt = new Date(clock()).toISOString(); entry.nextAttemptAt = null; }
        } catch (error) { entry.lastError = safeFailure(error); }
        if (entry.status !== 'accepted' && entry.attempts >= 8) entry.needsReview = true;
        lastMail[kind] = { ok: entry.status === 'accepted', at: new Date(clock()).toISOString() };
        // Persist SMTP acceptance before waiting for the optional database journal.
        persist(application, state);
        await log(state.ref, kind, entry, application.appId, kind === 'internal' ? config.mailTo : application.d.email);
    }
    async function sendApplication(application) {
        if (inFlight.has(application.context.ref)) return null;
        inFlight.add(application.context.ref);
        try {
            let state;
            try { if (application.dir) state = JSON.parse(fs.readFileSync(path.join(application.dir, 'mail-delivery.json'), 'utf8')); } catch (_) {}
            if (!state || state.version !== 1 || state.ref !== application.context.ref) state = { version: 1, ref: application.context.ref, appId: application.appId || null, context: application.context, internal: roleState(), acknowledgement: roleState() };
            persist(application, state);
            // Independent attempts: a dedicated acknowledgement account can work
            // even when the main transport is not configured.
            await Promise.all(['internal', 'acknowledgement'].map(async kind => {
                await attempt(kind, application, state);
            }));
            const persisted = persist(application, state);
            const pending = ['internal', 'acknowledgement'].some(kind => state[kind].status !== 'accepted' && state[kind].attempts < 8);
            return { ...state, retryScheduled: Boolean(persisted && pending) };
        } finally { inFlight.delete(application.context.ref); }
    }
    async function retryPending({ limit = 20 } = {}) {
        let processed = 0;
        let months; try { months = fs.readdirSync(config.dataDir); } catch (_) { return { processed }; }
        for (const month of months.filter(name => /^\d{4}-\d{2}$/.test(name))) {
            const monthDir = path.join(config.dataDir, month);
            if (!fs.lstatSync(monthDir).isDirectory() || fs.lstatSync(monthDir).isSymbolicLink()) continue;
            for (const ref of fs.readdirSync(monthDir).filter(name => /^CP-\d{6}-[A-F0-9]{6,32}$/.test(name))) {
                if (processed >= limit) return { processed };
                const dir = path.join(monthDir, ref);
                try {
                    if (!fs.lstatSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink()) continue;
                    const state = JSON.parse(fs.readFileSync(path.join(dir, 'mail-delivery.json'), 'utf8'));
                    if (state.version !== 1 || state.ref !== ref) continue;
                    const due = ['internal', 'acknowledgement'].some(kind => state[kind] && state[kind].status !== 'accepted' && state[kind].attempts < 8 && (!state[kind].nextAttemptAt || Date.parse(state[kind].nextAttemptAt) <= clock()));
                    if (!due) continue;
                    const d = JSON.parse(fs.readFileSync(path.join(dir, 'candidature.json'), 'utf8'));
                    if (!state.context || state.context.ref !== ref || !Array.isArray(d.files)) continue;
                    const files = d.files.map(name => {
                        if (typeof name !== 'string' || path.basename(name) !== name || /[\r\n]/.test(name)) throw Error();
                        const file = path.join(dir, name); if (fs.lstatSync(file).isSymbolicLink()) throw Error();
                        return { name, buf: fs.readFileSync(file) };
                    });
                    await sendApplication({ d, context: state.context, appId: state.appId, files, dir }); processed++;
                } catch (_) { /* Only new-version outbox records are retried; legacy dossiers remain untouched. */ }
            }
        }
        return { processed };
    }
    return { sendApplication, retryPending, lastMail, close() { for (const tr of transports.values()) if (tr.close) tr.close(); } };
}
module.exports = { createDelivery, safeFailure, addresses, mailbox };
