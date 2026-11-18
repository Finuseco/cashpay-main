#!/usr/bin/env node
'use strict';
const { isIP } = require('node:net');
const { loadConfiguration } = require('./config');

const SAFE_CODES = new Set([
    'EAUTH', 'ESOCKET', 'ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EHOSTUNREACH', 'EAI_AGAIN',
    'EENVELOPE', 'EMESSAGE', 'ETLS', 'ECERT', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID', 'ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED', 'MODULE_NOT_FOUND'
]);

function bareMailbox(value) {
    if (typeof value !== 'string' || /[\r\n\u0000]/.test(value) || value.length > 500) return null;
    const text = value.trim(), bracketed = text.match(/^[^<>]*<([^<>]+)>$/);
    const address = (bracketed ? bracketed[1] : text).trim();
    return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(address) ? address : null;
}
function safeRecipients(value) {
    const one = bareMailbox(value);
    if (one) return one;
    if (typeof value === 'string' && value.includes(',')) {
        const addresses = value.split(',').map(bareMailbox);
        if (addresses.length <= 20 && addresses.every(Boolean)) return addresses.join(', ');
    }
    return '[adresse à vérifier]';
}
function validHost(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 253 &&
        (Boolean(isIP(value)) || /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value));
}
function safeAccount(value) { return bareMailbox(value) || (value ? '[compte configuré]' : null); }
function safeFailure(error) {
    const result = { code: SAFE_CODES.has(error && error.code) ? error.code : 'SMTP_VERIFY_FAILED' };
    if (Number.isInteger(error && error.responseCode) && error.responseCode >= 100 && error.responseCode <= 599) result.responseCode = error.responseCode;
    if (typeof (error && error.command) === 'string' && /^(?:AUTH(?: (?:PLAIN|LOGIN|XOAUTH2|CRAM-MD5))?|CONN|STARTTLS|EHLO|HELO|MAIL FROM|RCPT TO|DATA|QUIT)$/.test(error.command)) result.command = error.command;
    return result;
}
const timeoutError = () => Object.assign(new Error('SMTP verification timeout'), { code: 'ETIMEDOUT' });

async function verifyAccount(account, transportFactory) {
    const configured = Boolean(validHost(account.host) && Number.isInteger(account.port) && account.port >= 1 && account.port <= 65535 &&
        typeof account.user === 'string' && account.user && typeof account.pass === 'string' && account.pass);
    const report = { configured, ok: false, host: validHost(account.host) ? account.host : null, port: Number.isInteger(account.port) ? account.port : null, user: safeAccount(account.user) };
    if (!configured) return { ...report, error: { code: 'SMTP_NOT_CONFIGURED' } };
    let transport, timer;
    try {
        transport = await transportFactory({ host: account.host, port: account.port, secure: account.port === 465,
            requireTLS: account.port !== 465, auth: { user: account.user, pass: account.pass },
            tls: { rejectUnauthorized: true }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 });
        if (!transport || typeof transport.verify !== 'function') throw new Error('SMTP transport unavailable');
        await Promise.race([transport.verify(), new Promise((_, reject) => { timer = setTimeout(() => reject(timeoutError()), 10000); })]);
        return { ...report, ok: true };
    } catch (error) {
        return { ...report, error: safeFailure(error) };
    } finally {
        clearTimeout(timer);
        try { await transport?.close?.(); } catch (_) { /* Closing must not expose a provider error or replace the check result. */ }
    }
}

/** Read-only SMTP authentication check. This function never calls sendMail. */
async function runCheck(env = process.env, { transportFactory, readFileSync } = {}) {
    const { config, provenance } = loadConfiguration({ env, ...(readFileSync ? { readFileSync } : {}) });
    const factory = transportFactory || (options => require('nodemailer').createTransport(options));
    const internal = await verifyAccount(config.smtp, factory);
    const hasDedicated = Boolean(config.noreply.user || config.noreply.pass);
    let acknowledgement;
    if (hasDedicated) acknowledgement = { ...(await verifyAccount(config.noreply, factory)), mode: 'dedicated' };
    else acknowledgement = { ...internal, mode: 'shared' };
    const warnings = [];
    for (const [channel, from, user] of [['internal', config.mailFrom, config.smtp.user], ['acknowledgement', config.noreplyFrom, hasDedicated ? config.noreply.user : config.smtp.user]]) {
        const sender = bareMailbox(from), account = bareMailbox(user);
        if (!sender) warnings.push({ channel, code: 'FROM_ADDRESS_INVALID', message: 'Vérifier le format de l’adresse expéditrice.' });
        else if (account && sender.toLowerCase() !== account.toLowerCase()) warnings.push({ channel, code: 'FROM_DIFFERS_FROM_AUTH', message: 'L’expéditeur diffère du compte SMTP ; vérifier que cet alias est autorisé.' });
    }
    return {
        service: 'cashpay-careers',
        checkedAt: new Date().toISOString(),
        ok: internal.ok && acknowledgement.ok,
        checks: 'smtp_authentication_only',
        deliveryTested: false,
        configuration: provenance,
        addresses: { to: safeRecipients(config.mailTo), internalFrom: bareMailbox(config.mailFrom), acknowledgementFrom: bareMailbox(config.noreplyFrom) },
        internal,
        acknowledgement,
        warnings
    };
}

function printReport(report) {
    console.log('Carrières — vérification SMTP en lecture seule (aucun e-mail envoyé)');
    console.log('Fichier de configuration : ' + (report.configuration.envFileLoaded ? 'chargé' : 'non chargé') + ' ; priorité messagerie : ' + report.configuration.mailPriority + '.');
    if (report.configuration.readErrorCode) console.log('Lecture du fichier : ' + report.configuration.readErrorCode);
    for (const [key, source] of Object.entries(report.configuration.fields)) console.log('  ' + key + ' : ' + source);
    console.log('Destination interne : ' + report.addresses.to);
    for (const [label, account, from] of [['Interne', report.internal, report.addresses.internalFrom], ['Accusé de réception', report.acknowledgement, report.addresses.acknowledgementFrom]]) {
        console.log(label + ' : ' + (account.ok ? 'authentification acceptée' : account.configured ? 'authentification non validée' : 'configuration incomplète') + (account.mode === 'shared' ? ' (compte principal réutilisé)' : ''));
        console.log('  Serveur : ' + (account.host || '[non configuré]') + ':' + (account.port || '?') + ' ; compte : ' + (account.user || '[non configuré]') + ' ; expéditeur : ' + (from || '[à vérifier]'));
        if (account.error) console.log('  Diagnostic : ' + JSON.stringify(account.error));
    }
    for (const warning of report.warnings) console.log('À vérifier (' + warning.channel + ') : ' + warning.message);
    console.log('Ce contrôle vérifie la connexion et les identifiants ; il ne prouve pas la réception dans une boîte ou une redirection.');
}

if (require.main === module) {
    if (process.argv.slice(2).some(argument => argument !== '--json')) {
        console.error('Usage : node careers-api/check-mail.js [--json]');
        process.exitCode = 2;
    } else runCheck().then(report => {
        if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2)); else printReport(report);
        process.exitCode = report.ok ? 0 : 1;
    }).catch(() => { console.error('Le contrôle SMTP n’a pas pu être terminé. Aucun e-mail n’a été envoyé.'); process.exitCode = 2; });
}

module.exports = { runCheck, bareMailbox };
