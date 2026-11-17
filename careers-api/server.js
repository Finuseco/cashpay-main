/* Service « Carrières » de CashPay All.
   Reçoit le formulaire de candidature (POST /api/careers, multipart), le vérifie, en garde une copie
   sur le disque (hors du site web) puis l'envoie par e-mail à info@cashpay-all.com avec les pièces jointes.
   Aucune dépendance sauf nodemailer. Configuration par variables d'environnement (voir README.md). */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration scoped to this service; SMTP values in its file override stale PM2 values.
const { loadConfiguration } = require('./config');
const { createDelivery, mailbox } = require('./mail-delivery');
function createService(options = {}) {
const logger = options.logger || console;
const resolved = loadConfiguration({ env: options.env || process.env, logger });
const CFG = options.config || resolved.config;
// Preserve optional database settings formerly loaded by loadEnvFile, without
// replacing credentials inherited from another process or modifying its files.
if (!options.db) for (const [key, value] of Object.entries(resolved.effectiveEnv)) {
    if ((key === 'DATABASE_URL' || key.startsWith('DB_')) && process.env[key] === undefined) process.env[key] = value;
}
const DB = options.db || require('./db');
const delivery = createDelivery(CFG, { transportFactory: options.transportFactory, db: DB, logger, clock: options.clock });
const JOBS = options.jobs || JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'js', 'jobs-data.json'), 'utf8'));
const POSITIONS = new Map(JOBS.positions.map(p => [p.key, p]));
const COUNTRIES = new Map(JOBS.countries.map(c => [c.code, c]));

// --- Utilitaires -------------------------------------------------------------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = (s, max) => String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const multiLine = (s, max) => String(s == null ? '' : s).replace(/\r\n/g, '\n').replace(/[^\S\n]+/g, ' ').trim().slice(0, max);
const safeName = s => oneLine(s, 120).replace(/[^\w.\- ()éèêàçùôîï]/gi, '_') || 'fichier';

const buckets = new Map();
function allow(key, max, windowMs) {
    const now = Date.now();
    if (buckets.size > 5000) buckets.forEach((v, k) => { if (v.reset <= now) buckets.delete(k); });
    const b = buckets.get(key);
    if (!b || b.reset <= now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
    b.n += 1; return b.n <= max;
}
function clientIp(req) {
    if (CFG.trustProxy) {
        const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        if (xf) return xf;
    }
    return req.socket.remoteAddress || 'unknown';
}
function send(res, status, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
}
const fail = (res, status, error, message) => send(res, status, { ok: false, error, message });

// Vérifie le contenu réel du fichier (pas seulement l'extension)
const SIGNATURES = {
    pdf: b => b.slice(0, 5).toString('latin1') === '%PDF-',
    docx: b => b[0] === 0x50 && b[1] === 0x4b,
    doc: b => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
    jpg: b => b[0] === 0xff && b[1] === 0xd8,
    jpeg: b => b[0] === 0xff && b[1] === 0xd8,
    png: b => b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG',
    webp: b => b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP'
};
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const CV_EXT = ['pdf', 'doc', 'docx'];
const DOC_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
async function readFile(file, allowedExt, maxBytes) {
    if (!file || typeof file === 'string' || !file.size) return { error: 'missing' };
    if (file.size > (maxBytes || CFG.maxFileBytes)) return { error: 'too_big', name: file.name };
    const ext = (String(file.name).split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(ext)) return { error: 'bad_type', name: file.name };
    const buf = Buffer.from(await file.arrayBuffer());
    if (!SIGNATURES[ext](buf)) return { error: 'bad_type', name: file.name };
    return { name: safeName(file.name), buf, ext };
}

// --- Traitement d'une candidature --------------------------------------------
async function handleApply(req, res) {
    const ip = clientIp(req);
    if (!allow('ip:' + ip, 6, 60 * 60 * 1000)) return fail(res, 429, 'rate_limit', 'Trop de candidatures depuis cette connexion. Réessayez plus tard.');
    const len = Number(req.headers['content-length'] || 0);
    if (!len || len > CFG.maxBodyBytes) return fail(res, 413, 'too_big', 'Les fichiers sont trop volumineux.');
    if (!/^multipart\/form-data/i.test(req.headers['content-type'] || '')) return fail(res, 400, 'bad_request', 'Requête invalide.');

    let form;
    try {
        const request = new Request('http://localhost/', { method: 'POST', headers: { 'content-type': req.headers['content-type'] }, body: req, duplex: 'half' });
        form = await request.formData();
    } catch (e) { return fail(res, 400, 'bad_request', 'Formulaire illisible.'); }

    const get = k => { const v = form.get(k); return typeof v === 'string' ? v : ''; };
    // Anti-robots : champ piège rempli, ou formulaire envoyé trop vite
    if (get('website')) return fail(res, 400, 'bad_request', 'Requête invalide.');
    const started = Number(get('t'));
    if (!started || Date.now() - started < 4000) return fail(res, 400, 'too_fast', 'Veuillez réessayer.');

    const d = {
        country: get('country'), province: oneLine(get('province'), 80), position: get('position'),
        lastName: oneLine(get('lastName'), 80), firstName: oneLine(get('firstName'), 80),
        gender: get('gender'), profession: oneLine(get('profession'), 100), age: parseInt(get('age'), 10), phone: oneLine(get('phone'), 30), email: oneLine(get('email'), 120).toLowerCase(),
        city: oneLine(get('city'), 80), message: multiLine(get('message'), 4000), lang: get('lang') === 'en' ? 'en' : 'fr'
    };
    const country = COUNTRIES.get(d.country), position = POSITIONS.get(d.position);
    if (!country) return fail(res, 422, 'country', 'Pays invalide.');
    if (!position) return fail(res, 422, 'position', 'Poste invalide.');
    if (!d.province || (country.provinces && !country.provinces.includes(d.province))) return fail(res, 422, 'province', 'Province invalide.');
    if (d.lastName.length < 2 || d.firstName.length < 2) return fail(res, 422, 'name', 'Nom et prénom requis.');
    if (d.gender !== 'M' && d.gender !== 'F') return fail(res, 422, 'gender', 'Sexe requis.');
    if (d.profession.length < 2) return fail(res, 422, 'profession', 'Profession requise.');
    if (!(d.age >= 16 && d.age <= 80)) return fail(res, 422, 'age', 'Âge invalide.');
    if (!/^[+\d][\d\s().-]{6,24}$/.test(d.phone)) return fail(res, 422, 'phone', 'Numéro de téléphone invalide.');
    if (mailbox(d.email) !== d.email) return fail(res, 422, 'email', 'Adresse e-mail invalide.');
    if (get('consent') !== '1') return fail(res, 422, 'consent', 'Consentement requis.');
    if (!allow('mail:' + d.email, 3, 24 * 60 * 60 * 1000)) return fail(res, 429, 'rate_limit', 'Vous avez déjà envoyé plusieurs candidatures aujourd\'hui.');

    const photo = await readFile(form.get('photo'), PHOTO_EXT, 3 * 1024 * 1024);
    if (photo.error === 'missing') return fail(res, 422, 'photo_missing', 'La photo de profil est obligatoire.');
    if (photo.error) return fail(res, 422, 'photo_' + photo.error, 'Photo refusée (JPG, PNG ou WEBP, 3 Mo maximum).');
    const cv = await readFile(form.get('cv'), CV_EXT);
    if (cv.error === 'missing') return fail(res, 422, 'cv_missing', 'Le CV est obligatoire.');
    if (cv.error) return fail(res, 422, 'cv_' + cv.error, 'CV : fichier refusé (PDF, DOC ou DOCX, 5 Mo maximum).');
    const docs = [];
    for (const f of form.getAll('docs').slice(0, 3)) {
        if (typeof f === 'string' || !f.size) continue;
        const r = await readFile(f, DOC_EXT);
        if (r.error) return fail(res, 422, 'doc_' + r.error, 'Document « ' + oneLine(f.name, 60) + ' » refusé (PDF, DOC, DOCX, JPG ou PNG, 5 Mo maximum).');
        docs.push(r);
    }

    // Total limité : une boîte mail refuse souvent plus de ~25 Mo (les pièces jointes grossissent d'un tiers à l'envoi)
    if (photo.buf.length + cv.buf.length + docs.reduce((n, x) => n + x.buf.length, 0) > CFG.maxTotalBytes) return fail(res, 422, 'total_too_big', 'Les fichiers dépassent 15 Mo au total. Réduisez leur taille.');

    const ref = 'CP-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const photoFile = { ...photo, name: 'Photo_' + photo.name };
    const files = [photoFile, { ...cv, name: 'CV_' + cv.name }, ...docs.map((x, i) => ({ ...x, name: 'Doc' + (i + 1) + '_' + x.name }))];

    // 1) Copie sur le disque (jamais perdue même si l'e-mail échoue)
    let saved = false, dir = null;
    try {
        dir = path.join(CFG.dataDir, new Date().toISOString().slice(0, 7), ref);
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        files.forEach(f => fs.writeFileSync(path.join(dir, f.name), f.buf, { mode: 0o600 }));
        fs.writeFileSync(path.join(dir, 'candidature.json'), JSON.stringify({ ref, date: new Date().toISOString(), ip, ...d, files: files.map(f => f.name) }, null, 2), { mode: 0o600 });
        saved = true;
    } catch (e) { logger.error('[careers] sauvegarde disque impossible ref=' + ref + ' code=' + (e.code || 'STORAGE_FAILED')); dir = null; }

    let appId = null;
    try { appId = await DB.saveApplication({ ref, ...d, positionLabel: position.fr, files: files.map(f => f.name), dir, ip }); }
    catch (_) { logger.error('[careers] base indisponible ref=' + ref); }

    // 2) Track SMTP acceptance separately from durable storage. A resolved
    // sendMail without accepted recipients is not a successful delivery.
    const rd = new Date(Date.now() + Number(resolved.effectiveEnv.RESULTS_DAYS || 14) * 86400000);
    const context = { resultsDate: rd.toLocaleDateString(d.lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kinshasa' }), ref, position: position.fr, positionEn: position.en, country: country.name, files: files.map(f => f.name) };
    const outcome = await delivery.sendApplication({ d, context, files, dir: saved ? dir : null, appId });
    const status = kind => outcome && outcome[kind].status === 'accepted' ? 'accepted' : saved ? 'pending' : 'failed';
    const mailDelivery = { internal: status('internal'), acknowledgement: status('acknowledgement') };
    logger.log('[careers] ' + ref + ' saved=' + saved + ' internal=' + mailDelivery.internal + ' acknowledgement=' + mailDelivery.acknowledgement);
    const retryScheduled = Boolean(outcome && outcome.retryScheduled);
    if (mailDelivery.internal === 'accepted') return send(res, 200, { ok: true, ref, saved, delivery: mailDelivery, retryScheduled });
    if (saved) return send(res, 202, { ok: true, ref, saved: true, delivery: mailDelivery, retryScheduled,
        message: retryScheduled ? 'Candidature enregistrée. La notification par e-mail est en attente ; ne soumettez pas à nouveau votre dossier.' : 'Candidature enregistrée. La notification nécessite une vérification manuelle ; contactez le recrutement avec votre référence.' });
    return send(res, 503, { ok: false, error: 'mail_unavailable', saved: false, ref, delivery: mailDelivery, message: 'Votre candidature n’a pas pu être enregistrée ni transmise au service de recrutement. Veuillez réessayer plus tard.' });
}

// --- Serveur -----------------------------------------------------------------
const server = http.createServer((req, res) => {
    const url = (req.url || '').split('?')[0];
    if (req.method === 'GET' && (url === '/api/careers/health' || url === '/api/careers/health/')) {
        const configured = Boolean(CFG.smtp.host && CFG.smtp.user && CFG.smtp.pass);
        return send(res, 200, { ok: true, smtp: configured, smtpConfigured: configured,
            smtpVerified: false, smtpStatus: 'configuration_only', database: DB.enabled(),
            dataDir: fs.existsSync(CFG.dataDir), lastMail: delivery.lastMail });
    }
    if (req.method === 'POST' && (url === '/api/careers' || url === '/api/careers/')) {
        handleApply(req, res).catch(e => { logger.error('[careers] traitement impossible'); if (!res.headersSent) fail(res, 500, 'server', 'Erreur du serveur.'); });
        return;
    }
    fail(res, 404, 'not_found', 'Introuvable.');
});
server.requestTimeout = 120000; server.headersTimeout = 20000;
let retryTimer = null, retryRunning = false;
server.startMailRetries = () => {
    if (retryTimer) return;
    const run = async () => {
        if (retryRunning) return;
        retryRunning = true;
        try { await delivery.retryPending(); } catch (_) { logger.error('[careers] reprise des e-mails indisponible'); }
        finally { retryRunning = false; }
    };
    retryTimer = setInterval(run, 60000); retryTimer.unref();
    run();
};
server.on('close', () => { clearInterval(retryTimer); retryTimer = null; delivery.close(); });
server.handleRequest = server.listeners('request')[0];
server.retryPendingMail = delivery.retryPending;
server.config = CFG;
return server;
}
const server = createService();
if (require.main === module) server.listen(server.config.port, server.config.host, () => {
    console.log('[careers] à l’écoute sur ' + server.config.host + ':' + server.config.port);
    server.startMailRetries();
});
module.exports = server;
module.exports.createService = createService;
