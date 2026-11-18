'use strict';
const fs = require('node:fs');
const { parse } = require('./envfile');

const MAIL_KEYS = [
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_PASS',
    'NOREPLY_SMTP_HOST', 'NOREPLY_SMTP_PORT', 'NOREPLY_SMTP_USER', 'NOREPLY_SMTP_PASSWORD', 'NOREPLY_SMTP_PASS',
    'MAIL_TO', 'MAIL_FROM', 'MAIL_NOREPLY'
];
const isMailKey = key => /^(?:SMTP_|NOREPLY_SMTP_|MAIL_)/.test(key);
const READ_ERROR_CODES = new Set(['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EMFILE', 'ENFILE', 'EIO', 'EINVAL', 'ELOOP', 'ENAMETOOLONG']);

/** Resolve this service's configuration without changing process.env or another application. */
function loadConfiguration({ env = process.env, readFileSync = fs.readFileSync, logger } = {}) {
    const supplied = env || {};
    const envFile = supplied.CAREERS_ENV_FILE || '/etc/cashpay-careers.env';
    let fileValues = {}, envFileLoaded = false, readErrorCode;
    try {
        fileValues = parse(readFileSync(envFile, 'utf8'), supplied);
        envFileLoaded = true;
    } catch (error) {
        readErrorCode = READ_ERROR_CODES.has(error && error.code) ? error.code : 'ENV_READ_FAILED';
        if (readErrorCode !== 'ENOENT' && logger && typeof logger.warn === 'function') {
            logger.warn('[careers] fichier de configuration non chargé (' + readErrorCode + ').');
        }
    }
    const requestedPriority = supplied.CAREERS_ENV_PRIORITY === undefined ? fileValues.CAREERS_ENV_PRIORITY : supplied.CAREERS_ENV_PRIORITY;
    const mailPriority = requestedPriority === 'process' ? 'process' : 'file';
    const effectiveEnv = { ...supplied };
    const sources = {};
    for (const key of Object.keys(supplied)) if (supplied[key] !== undefined) sources[key] = 'process';
    for (const [key, value] of Object.entries(fileValues)) {
        if (effectiveEnv[key] === undefined || (mailPriority === 'file' && isMailKey(key))) {
            effectiveEnv[key] = value;
            sources[key] = 'file';
        }
    }
    // Resolve each password family by source first, then prefer its canonical key.
    // Otherwise a stale process PASSWORD would still hide a current file PASS.
    const aliases = {};
    for (const [canonical, alias] of [['SMTP_PASSWORD', 'SMTP_PASS'], ['NOREPLY_SMTP_PASSWORD', 'NOREPLY_SMTP_PASS']]) {
        const candidates = mailPriority === 'file' ? [[fileValues, 'file'], [supplied, 'process']] : [[supplied, 'process'], [fileValues, 'file']];
        for (const [values, source] of candidates) {
            const selected = values[canonical] !== undefined ? canonical : values[alias] !== undefined ? alias : null;
            if (selected) {
                effectiveEnv[canonical] = values[selected];
                sources[canonical] = source;
                if (selected === alias) aliases[canonical] = alias;
                break;
            }
        }
    }
    const smtp = {
        host: effectiveEnv.SMTP_HOST,
        port: Number(effectiveEnv.SMTP_PORT || 587),
        user: effectiveEnv.SMTP_USER,
        pass: effectiveEnv.SMTP_PASSWORD
    };
    const noreply = {
        host: effectiveEnv.NOREPLY_SMTP_HOST || smtp.host,
        port: Number(effectiveEnv.NOREPLY_SMTP_PORT || effectiveEnv.SMTP_PORT || 587),
        user: effectiveEnv.NOREPLY_SMTP_USER,
        pass: effectiveEnv.NOREPLY_SMTP_PASSWORD
    };
    const dedicated = Boolean(noreply.host && noreply.user && noreply.pass);
    const config = {
        port: Number(effectiveEnv.PORT || 8010),
        host: effectiveEnv.HOST || '127.0.0.1',
        mailTo: effectiveEnv.MAIL_TO || 'info@cashpay-all.com',
        mailFrom: effectiveEnv.MAIL_FROM || smtp.user || 'info@cashpay-all.com',
        noreplyFrom: effectiveEnv.MAIL_NOREPLY || (dedicated ? noreply.user : smtp.user) || 'noreply@cashpay-all.com',
        noreply,
        smtp,
        dataDir: effectiveEnv.DATA_DIR || '/var/lib/cashpay-careers',
        trustProxy: effectiveEnv.TRUST_PROXY === '1',
        maxFileBytes: 5 * 1024 * 1024,
        maxTotalBytes: 15 * 1024 * 1024,
        maxBodyBytes: 22 * 1024 * 1024
    };
    const fields = Object.fromEntries(MAIL_KEYS.map(key => [key, effectiveEnv[key] === undefined ? 'missing' : sources[key] || 'missing']));
    const provenance = { envFileLoaded, mailPriority, fields, ...(readErrorCode ? { readErrorCode } : {}), ...(Object.keys(aliases).length ? { aliases } : {}) };
    return { config, provenance, effectiveEnv };
}

module.exports = { loadConfiguration };
