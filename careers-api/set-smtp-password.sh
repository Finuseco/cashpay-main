#!/usr/bin/env bash
# Met à jour le mot de passe de noreply@ partout, APRÈS l'avoir testé.
#   bash careers-api/set-smtp-password.sh
cd "$(dirname "$0")" || exit 1
W="${WEB_DIR:-$(pm2 describe cashpay-wallet 2>/dev/null | grep 'exec cwd' | awk '{print $(NF-1)}')}"; W="${W:-/var/www/cashpay-all/wallet}"
read -rsp "Mot de passe de noreply@cashpay-all.com (défini dans LWS) : " SMTP_NEW_PASSWORD; echo
export SMTP_NEW_PASSWORD
node set-smtp-password.js "$W" || exit 1
unset SMTP_NEW_PASSWORD
echo "Redémarrage de CashPay Web et du service Carrières…"
pm2 restart cashpay-wallet --update-env >/dev/null && pm2 restart cashpay-careers --update-env >/dev/null && echo "✔ Redémarrés."
echo "Test final :"; bash ./compare-smtp.sh "$W"
