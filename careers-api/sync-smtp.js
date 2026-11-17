/* Copie les réglages SMTP d'une application qui fonctionne (CashPay Web, portail développeur…) vers /etc/cashpay-careers.env
   en appliquant les mêmes règles de lecture que Next.js. Usage : node sync-smtp.js /chemin/vers/.env [/etc/cashpay-careers.env] */
'use strict';
const fs = require('fs'), { parse, quote } = require('./envfile');
const [src, dst = '/etc/cashpay-careers.env'] = process.argv.slice(2);
if (!src || !fs.existsSync(src)) { console.error('Fichier source introuvable : ' + src); process.exit(1); }
const s = parse(fs.readFileSync(src, 'utf8'), {});
const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
const missing = keys.filter(k => !s[k]); if (missing.length) { console.error('Manquant dans ' + src + ' : ' + missing.join(', ')); process.exit(1); }
const old = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
fs.writeFileSync(dst + '.bak', old, { mode: 0o600 });
const kept = old.split(/\r?\n/).filter(l => l.trim() && !/^\s*SMTP_(HOST|PORT|USER|PASSWORD)\s*=/.test(l));
fs.writeFileSync(dst, kept.concat(keys.map(k => k + '=' + quote(s[k]))).join('\n') + '\n', { mode: 0o600 });
console.log('Copié depuis ' + src + ' : ' + s.SMTP_HOST + ':' + s.SMTP_PORT + ' compte ' + s.SMTP_USER + ' (mot de passe de ' + s.SMTP_PASSWORD.length + ' caractères). Ancien fichier sauvegardé : ' + dst + '.bak');
