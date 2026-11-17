#!/usr/bin/env bash
# Diagnostic de la messagerie du service Carrières. Une commande :
#   bash /var/www/cashpay-all/main/careers-api/diagnose.sh [adresse_de_test]
# Affiche : réglages (sans mot de passe), test de connexion SMTP, envoi d'un message d'essai, DNS (MX/SPF/DKIM/DMARC), derniers journaux.
cd "$(dirname "$0")" || exit 1
ENV_FILE="${ENV_FILE:-/etc/cashpay-careers.env}"
TEST_TO="${1:-}"
[ -f "$ENV_FILE" ] || { echo "Fichier $ENV_FILE introuvable : lancez d'abord install.sh"; exit 1; }
echo "=== 1. Réglages lus dans $ENV_FILE (mots de passe masqués) ==="
sed -E 's/^(([A-Z_]*PASS[A-Z_]*)|DATABASE_URL)=.*/\1=********/' "$ENV_FILE"
echo
echo "=== 2. Connexion SMTP et envoi d'essai ==="
ENV_FILE="$ENV_FILE" TEST_TO="$TEST_TO" node -e '
const fs=require("fs");
const v=require("./envfile").parse(fs.readFileSync(process.env.ENV_FILE,"utf8"),process.env);Object.keys(v).forEach(k=>{if(process.env[k]===undefined)process.env[k]=v[k]});
const e=process.env,nm=require("nodemailer"),port=Number(e.SMTP_PORT||587);
const tr=nm.createTransport({host:e.SMTP_HOST,port,secure:port===465,auth:{user:e.SMTP_USER,pass:e.SMTP_PASSWORD},connectionTimeout:15000});
const to=process.env.TEST_TO||e.MAIL_TO||"info@cashpay-all.com";
(async()=>{
 console.log("Serveur :",e.SMTP_HOST+":"+port,"| compte :",e.SMTP_USER);
 try{await tr.verify();console.log("OK  connexion et identifiants acceptés");}
 catch(x){console.log("ECHEC connexion :",x.message);
  if(/535|Invalid login|auth/i.test(x.message))console.log("-> Identifiants refusés. Le compte SMTP_USER doit être une VRAIE boîte mail (ex. noreply@cashpay-all.com), pas une redirection comme info@. Corrigez SMTP_USER / SMTP_PASSWORD dans le fichier.");
  if(/ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(x.message))console.log("-> Serveur ou port injoignable : vérifiez SMTP_HOST et SMTP_PORT (465 ou 587) et que le serveur autorise les connexions sortantes.");
  return;}
 try{const r=await tr.sendMail({from:"\"CashPay All\" <"+(e.MAIL_FROM||e.SMTP_USER)+">",to,subject:"Test messagerie Carrières CashPay All",text:"Si vous lisez ce message, l\x27envoi fonctionne. Vérifiez aussi le dossier Courrier indésirable."});
  console.log("OK  message d\x27essai accepté pour",to,"|",r.response);console.log("    Vérifiez la boîte de réception ET les indésirables.");}
 catch(x){console.log("ECHEC envoi :",x.message)}
})()'
echo
DOM=cashpay-all.com
echo "=== 3. DNS de $DOM ==="
if command -v dig >/dev/null; then
  echo "-- MX :";    dig +short MX "$DOM"
  echo "-- SPF :";   dig +short TXT "$DOM" | grep -i spf || echo "AUCUN SPF : à ajouter chez votre gestionnaire DNS (voir la valeur conseillée dans le panel LWS, onglet e-mails)"
  echo "-- DKIM (sélecteur dkim) :"; dig +short TXT "dkim._domainkey.$DOM" | head -c 200; echo
  [ -n "$(dig +short TXT dkim._domainkey.$DOM)" ] || echo "AUCUN DKIM publié : copiez la clé DKIM du panel LWS dans un enregistrement TXT « dkim._domainkey »"
  echo "-- DMARC :"; dig +short TXT "_dmarc.$DOM" || true
  [ -n "$(dig +short TXT _dmarc.$DOM)" ] || echo "AUCUN DMARC : conseillé TXT _dmarc = v=DMARC1; p=none; rua=mailto:info@$DOM"
else echo "dig absent : apt install -y dnsutils"; fi
echo
echo "=== 4. Santé du service et derniers journaux ==="
P="$(grep -E '^PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2)"; curl -fsS "http://127.0.0.1:${P:-8010}/api/careers/health"; echo
pm2 logs cashpay-careers --lines 25 --nostream 2>/dev/null | grep -E "careers" | tail -15
