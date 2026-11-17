#!/usr/bin/env bash
# Compare les réglages d'envoi de CashPay Web (qui fonctionne) et du service Carrières. Aucun mot de passe n'est affiché.
#   bash careers-api/compare-smtp.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
W="${1:-$(pm2 describe cashpay-wallet 2>/dev/null | grep 'exec cwd' | awk '{print $(NF-1)}')}"; W="${W:-/var/www/cashpay-all/wallet}"
echo "--- CASHPAY WEB ($W), lu comme Next.js"
(cd "$W" && NODE_ENV=production node -e '
require("@next/env").loadEnvConfig(process.cwd(),false);
const e=process.env,nm=require("nodemailer"),sha=s=>require("crypto").createHash("sha256").update(String(s)).digest("hex").slice(0,8);
console.log(e.SMTP_HOST,e.SMTP_PORT,e.SMTP_USER,"| mot de passe:",String(e.SMTP_PASSWORD).length,"caractères, empreinte",sha(e.SMTP_PASSWORD));
nm.createTransport({host:e.SMTP_HOST,port:+e.SMTP_PORT,secure:+e.SMTP_PORT===465,auth:{user:e.SMTP_USER,pass:e.SMTP_PASSWORD}}).verify().then(()=>console.log("OK connexion"),x=>console.log("ECHEC:",x.message))')
echo "--- SERVICE CARRIERES (/etc/cashpay-careers.env)"
(cd "$HERE" && node -e '
const v=require("./envfile").parse(require("fs").readFileSync("/etc/cashpay-careers.env","utf8"),{}),nm=require("nodemailer");
const sha=s=>require("crypto").createHash("sha256").update(String(s)).digest("hex").slice(0,8);
console.log(v.SMTP_HOST,v.SMTP_PORT,v.SMTP_USER,"| mot de passe:",String(v.SMTP_PASSWORD).length,"caractères, empreinte",sha(v.SMTP_PASSWORD));
nm.createTransport({host:v.SMTP_HOST,port:+v.SMTP_PORT,secure:+v.SMTP_PORT===465,auth:{user:v.SMTP_USER,pass:v.SMTP_PASSWORD}}).verify().then(()=>console.log("OK connexion"),x=>console.log("ECHEC:",x.message))')
