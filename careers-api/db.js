/* Enregistrement facultatif dans PostgreSQL (tables de cashpay_web/migrations/20261117_career_applications.sql).
   Actif seulement si DB_HOST / DB_USER / DB_NAME sont définis. Une erreur de base ne bloque jamais la candidature. */
'use strict';
let pool = null, tried = false;
function getPool() {
    if (tried) return pool; tried = true;
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSL_CA, DATABASE_URL } = process.env;
    if (!DATABASE_URL && !(DB_HOST && DB_USER && DB_NAME)) return null;
    try {
        const { Pool } = require('pg');
        pool = new Pool(DATABASE_URL ? { connectionString: DATABASE_URL, max: 3 } : { host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, port: Number(DB_PORT || 5432), max: 3, ssl: DB_SSL_CA ? { ca: DB_SSL_CA, rejectUnauthorized: true } : undefined, connectionTimeoutMillis: 8000 });
        pool.on('error', e => console.error('[careers] base :', e.message));
    } catch (e) { console.error('[careers] module pg indisponible :', e.message); pool = null; }
    return pool;
}
const enabled = () => !!getPool();
async function saveApplication(a) {
    const p = getPool(); if (!p) return null;
    try {
        const r = await p.query(
            `INSERT INTO career_applications (ref, country, province, position, position_label, last_name, first_name, gender, age, profession, phone, email, city, message, lang, files, storage_dir, ip)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$18) RETURNING id`,
            [a.ref, a.country, a.province, a.position, a.positionLabel, a.lastName, a.firstName, a.gender, a.age, a.profession, a.phone, a.email, a.city || null, a.message || null, a.lang, JSON.stringify(a.files || []), a.dir || null, a.ip || null]);
        return r.rows[0].id;
    } catch (e) { console.error('[careers] enregistrement en base impossible :', e.message); return null; }
}
async function logMail(applicationId, kind, to, ok, error) {
    const p = getPool(); if (!p || !applicationId) return;
    try { await p.query('INSERT INTO career_email_log (application_id, kind, to_email, ok, error) VALUES ($1,$2,$3,$4,$5)', [applicationId, kind, to, ok, error ? String(error).slice(0, 500) : null]); }
    catch (e) { console.error('[careers] journal e-mail impossible :', e.message); }
}
module.exports = { enabled, saveApplication, logMail };
