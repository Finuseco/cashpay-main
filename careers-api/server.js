/* Service « Carrières » de CashPay All.
   Reçoit le formulaire de candidature (POST /api/careers, multipart), le vérifie, en garde une copie
   sur le disque (hors du site web) puis l'envoie par e-mail à info@cashpay-all.com avec les pièces jointes.
   Aucune dépendance sauf nodemailer. Configuration par variables d'environnement (voir README.md). */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Configuration -----------------------------------------------------------
function loadEnvFile(file) {
    try {
        fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(line => {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
            if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        });
    } catch (e) { /* fichier absent : on utilise l'environnement */ }
}
loadEnvFile(process.env.CAREERS_ENV_FILE || '/etc/cashpay-careers.env');

const CFG = {
    port: Number(process.env.PORT || 8010),
    host: process.env.HOST || '127.0.0.1',
    mailTo: process.env.MAIL_TO || 'info@cashpay-all.com',
    mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || 'info@cashpay-all.com',
    smtp: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    dataDir: process.env.DATA_DIR || '/var/lib/cashpay-careers',      // hors du dossier web !
    trustProxy: process.env.TRUST_PROXY === '1',
    maxFileBytes: 5 * 1024 * 1024,
    maxTotalBytes: 15 * 1024 * 1024,
    maxBodyBytes: 22 * 1024 * 1024
};

const JOBS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'js', 'jobs-data.json'), 'utf8'));
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
    png: b => b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG'
};
const CV_EXT = ['pdf', 'doc', 'docx'];
const DOC_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
async function readFile(file, allowedExt) {
    if (!file || typeof file === 'string' || !file.size) return { error: 'missing' };
    if (file.size > CFG.maxFileBytes) return { error: 'too_big', name: file.name };
    const ext = (String(file.name).split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(ext)) return { error: 'bad_type', name: file.name };
    const buf = Buffer.from(await file.arrayBuffer());
    if (!SIGNATURES[ext](buf)) return { error: 'bad_type', name: file.name };
    return { name: safeName(file.name), buf, ext };
}

let transporter = null;
function mailer() {
    if (transporter) return transporter;
    if (!CFG.smtp.host || !CFG.smtp.user || !CFG.smtp.pass) return null;
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({ host: CFG.smtp.host, port: CFG.smtp.port, secure: CFG.smtp.port === 465, auth: { user: CFG.smtp.user, pass: CFG.smtp.pass } });
    return transporter;
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
    if (get('website')) return send(res, 200, { ok: true, ref: 'CP-OK' });
    const started = Number(get('t'));
    if (!started || Date.now() - started < 4000) return fail(res, 400, 'too_fast', 'Veuillez réessayer.');

    const d = {
        country: get('country'), province: oneLine(get('province'), 80), position: get('position'),
        lastName: oneLine(get('lastName'), 80), firstName: oneLine(get('firstName'), 80),
        age: parseInt(get('age'), 10), phone: oneLine(get('phone'), 30), email: oneLine(get('email'), 120).toLowerCase(),
        city: oneLine(get('city'), 80), message: multiLine(get('message'), 4000), lang: get('lang') === 'en' ? 'en' : 'fr'
    };
    const country = COUNTRIES.get(d.country), position = POSITIONS.get(d.position);
    if (!country) return fail(res, 422, 'country', 'Pays invalide.');
    if (!position) return fail(res, 422, 'position', 'Poste invalide.');
    if (!d.province || (country.provinces && !country.provinces.includes(d.province))) return fail(res, 422, 'province', 'Province invalide.');
    if (d.lastName.length < 2 || d.firstName.length < 2) return fail(res, 422, 'name', 'Nom et prénom requis.');
    if (!(d.age >= 16 && d.age <= 80)) return fail(res, 422, 'age', 'Âge invalide.');
    if (!/^[+\d][\d\s().-]{6,24}$/.test(d.phone)) return fail(res, 422, 'phone', 'Numéro de téléphone invalide.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return fail(res, 422, 'email', 'Adresse e-mail invalide.');
    if (get('consent') !== '1') return fail(res, 422, 'consent', 'Consentement requis.');
    if (!allow('mail:' + d.email, 3, 24 * 60 * 60 * 1000)) return fail(res, 429, 'rate_limit', 'Vous avez déjà envoyé plusieurs candidatures aujourd\'hui.');

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
    if (cv.buf.length + docs.reduce((n, x) => n + x.buf.length, 0) > CFG.maxTotalBytes) return fail(res, 422, 'total_too_big', 'Les fichiers dépassent 15 Mo au total. Réduisez leur taille.');

    const ref = 'CP-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const files = [{ ...cv, name: 'CV_' + cv.name }, ...docs.map((x, i) => ({ ...x, name: 'Doc' + (i + 1) + '_' + x.name }))];

    // 1) Copie sur le disque (jamais perdue même si l'e-mail échoue)
    let saved = false;
    try {
        const dir = path.join(CFG.dataDir, new Date().toISOString().slice(0, 7), ref);
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        fs.writeFileSync(path.join(dir, 'candidature.json'), JSON.stringify({ ref, date: new Date().toISOString(), ip, ...d, files: files.map(f => f.name) }, null, 2), { mode: 0o600 });
        files.forEach(f => fs.writeFileSync(path.join(dir, f.name), f.buf, { mode: 0o600 }));
        saved = true;
    } catch (e) { console.error('[careers] sauvegarde disque impossible :', e.message); }

    // 2) E-mail vers info@cashpay-all.com
    let mailed = false;
    const tr = mailer();
    if (tr) {
        const where = [d.province, country.name].join(', ');
        const rows = [
            ['Référence', ref], ['Poste', position.fr], ['Pays', country.name], ['Province / région', d.province],
            ['Nom', d.lastName], ['Prénom', d.firstName], ['Âge', d.age + ' ans'], ['Téléphone', d.phone], ['E-mail', d.email], ['Ville / commune', d.city || '—']
        ];
        const text = rows.map(r => r[0] + ' : ' + r[1]).join('\n') + '\n\nMessage :\n' + (d.message || '—') + '\n\nPièces jointes : ' + files.map(f => f.name).join(', ');
        const html = '<h2>Nouvelle candidature — ' + esc(position.fr) + '</h2><table cellpadding="6" style="border-collapse:collapse">' +
            rows.map(r => '<tr><td style="background:#f3edf9"><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>' +
            '<h3>Message</h3><p style="white-space:pre-wrap">' + esc(d.message || '—') + '</p><p>Pièces jointes : ' + esc(files.map(f => f.name).join(', ')) + '</p>';
        try {
            await tr.sendMail({
                from: '"CashPay All Carrières" <' + CFG.mailFrom + '>', to: CFG.mailTo, replyTo: '"' + d.firstName.replace(/"/g, '') + ' ' + d.lastName.replace(/"/g, '') + '" <' + d.email + '>',
                subject: '[Candidature] ' + position.fr + ' — ' + d.lastName + ' ' + d.firstName + ' (' + where + ') — ' + ref,
                text, html, attachments: files.map(f => ({ filename: f.name, content: f.buf }))
            });
            mailed = true;
        } catch (e) { console.error('[careers] e-mail non envoyé :', e.message); }
    } else console.error('[careers] SMTP non configuré : candidature ' + ref + ' enregistrée sur disque seulement.');

    if (!saved && !mailed) return fail(res, 500, 'server', 'Un problème est survenu. Écrivez-nous à ' + CFG.mailTo + '.');
    console.log('[careers] ' + ref + ' ' + position.key + ' ' + d.country + '/' + d.province + ' saved=' + saved + ' mailed=' + mailed);
    return send(res, 200, { ok: true, ref });
}

// --- Serveur -----------------------------------------------------------------
const server = http.createServer((req, res) => {
    const url = (req.url || '').split('?')[0];
    if (req.method === 'GET' && (url === '/api/careers/health' || url === '/api/careers/health/')) return send(res, 200, { ok: true, smtp: !!mailer(), dataDir: fs.existsSync(CFG.dataDir) });
    if (req.method === 'POST' && (url === '/api/careers' || url === '/api/careers/')) {
        handleApply(req, res).catch(e => { console.error('[careers] erreur :', e); if (!res.headersSent) fail(res, 500, 'server', 'Erreur du serveur.'); });
        return;
    }
    fail(res, 404, 'not_found', 'Introuvable.');
});
server.requestTimeout = 120000; server.headersTimeout = 20000;
if (require.main === module) server.listen(CFG.port, CFG.host, () => console.log('[careers] à l\'écoute sur ' + CFG.host + ':' + CFG.port));
module.exports = server;
