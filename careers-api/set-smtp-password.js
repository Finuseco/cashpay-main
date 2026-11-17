/* Teste un mot de passe auprès du serveur de messagerie ; s'il est accepté, l'écrit dans CashPay Web et dans le service Carrières.
   Le mot de passe arrive par la variable d'environnement SMTP_NEW_PASSWORD (jamais en argument, jamais affiché). */
'use strict';
const fs = require('fs'), { parse, quote } = require('./envfile');
const [webDir, careersEnv = '/etc/cashpay-careers.env'] = process.argv.slice(2);
const pw = process.env.SMTP_NEW_PASSWORD || '';
const die = m => { console.error('✖ ' + m); process.exit(1); };
if (!webDir || !pw) die('usage : SMTP_NEW_PASSWORD=… node set-smtp-password.js /dossier/cashpay-web [/etc/cashpay-careers.env]');
if (pw.indexOf("'") !== -1 || /[\r\n]/.test(pw)) die("Le mot de passe ne doit contenir ni apostrophe ni retour à la ligne.");
const cfg = parse(fs.readFileSync(webDir + '/.env', 'utf8'), {});
['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER'].forEach(k => { if (!cfg[k]) die(k + ' manque dans ' + webDir + '/.env'); });
const nm = require('nodemailer'), port = Number(cfg.SMTP_PORT);
nm.createTransport({ host: cfg.SMTP_HOST, port, secure: port === 465, auth: { user: cfg.SMTP_USER, pass: pw }, connectionTimeout: 15000 }).verify().then(() => {
    console.log('✔ Le serveur de messagerie accepte ce mot de passe pour ' + cfg.SMTP_USER + '.');
    const files = [webDir + '/.env', webDir + '/.env.production', webDir + '/.env.local', webDir + '/.env.production.local', careersEnv].filter(f => fs.existsSync(f) && /^\s*SMTP_PASSWORD\s*=/m.test(fs.readFileSync(f, 'utf8')));
    if (!files.length) die('Aucun fichier avec SMTP_PASSWORD trouvé.');
    files.forEach(f => {
        const old = fs.readFileSync(f, 'utf8'); fs.writeFileSync(f + '.bak-smtp', old, { mode: 0o600 });
        fs.writeFileSync(f, old.replace(/^(\s*)SMTP_PASSWORD\s*=.*$/m, (m, sp) => sp + 'SMTP_PASSWORD=' + quote(pw)));
        console.log('  mis à jour : ' + f + ' (copie : ' + f + '.bak-smtp)');
    });
}, e => { console.error('✖ Mot de passe REFUSÉ : ' + e.message + '\n  Rien n\'a été modifié. Vérifiez qu\'il s\'agit bien du mot de passe défini dans LWS pour ' + cfg.SMTP_USER + '.'); process.exit(2); });
