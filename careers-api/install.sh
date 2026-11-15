#!/usr/bin/env bash
# Installation du service Carrières en UNE commande, sur le serveur :
#   bash /var/www/cashpay-all/cashpay-main/careers-api/install.sh
# - reprend les réglages SMTP du portail développeur (même serveur de messagerie)
# - installe, démarre le service avec pm2
# - ajoute la route /api/careers dans nginx (avec test et retour arrière automatique en cas d'erreur)
set -euo pipefail
cd "$(dirname "$0")"

DEV_ENV="${DEV_ENV:-/var/www/cashpay-all/developer/.env}"
ENV_FILE="${ENV_FILE:-/etc/cashpay-careers.env}"
NGINX_DIR="${NGINX_DIR:-/etc/nginx}"
DOMAIN="${DOMAIN:-cashpay-all.com}"
APP=cashpay-careers

say() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

say "1/5 Réglages e-mail (SMTP)"
if [ ! -f "$ENV_FILE" ]; then
    [ -f "$DEV_ENV" ] || die "Fichier du portail développeur introuvable : $DEV_ENV (indiquez-le avec DEV_ENV=/chemin/.env)"
    port=8010
    while ss -ltn 2>/dev/null | grep -qE "[:.]${port}[[:space:]]"; do port=$((port + 1)); done
    ( umask 077
      grep -E '^SMTP_(HOST|PORT|USER|PASSWORD)=' "$DEV_ENV" > "$ENV_FILE" || true
      printf 'MAIL_TO=info@%s\nTRUST_PROXY=1\nPORT=%s\n' "$DOMAIN" "$port" >> "$ENV_FILE" )
    echo "Réglages copiés depuis le portail développeur → $ENV_FILE (port $port)"
else
    echo "$ENV_FILE existe déjà : conservé tel quel."
fi
chmod 600 "$ENV_FILE"
for k in SMTP_HOST SMTP_USER SMTP_PASSWORD; do
    grep -qE "^${k}=.+" "$ENV_FILE" || die "$k manque dans $ENV_FILE : le portail développeur n'a pas de réglages SMTP dans $DEV_ENV. Ajoutez la ligne ${k}=… dans $ENV_FILE puis relancez ce script."
done
PORT_USED="$(grep -E '^PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2)"; PORT_USED="${PORT_USED:-8010}"

say "2/5 Installation des dépendances"
npm install --omit=dev --no-audit --no-fund

say "3/5 Démarrage du service (pm2)"
if pm2 describe "$APP" >/dev/null 2>&1; then pm2 restart "$APP" --update-env; else pm2 start server.js --name "$APP"; fi
pm2 save >/dev/null

say "4/5 Route nginx /api/careers"
SNIP="$NGINX_DIR/snippets/cashpay-careers.conf"
mkdir -p "$NGINX_DIR/snippets"
cat > "$SNIP" <<CONF
# Généré par careers-api/install.sh
location ^~ /api/careers {
    client_max_body_size 25m;
    proxy_pass http://127.0.0.1:${PORT_USED};
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$remote_addr;
}
# Ne jamais exposer le code du service
location ^~ /careers-api/ { return 404; }
CONF
files="$(grep -lE "server_name([^;]*[[:space:]])?${DOMAIN//./\\.}([[:space:]][^;]*)?;" "$NGINX_DIR"/sites-enabled/* "$NGINX_DIR"/conf.d/*.conf 2>/dev/null || true)"
[ -n "$files" ] || die "Aucun site nginx avec server_name $DOMAIN trouvé. Ajoutez 'include snippets/cashpay-careers.conf;' dans son bloc server, puis : nginx -t && systemctl reload nginx"
changed=""
for f in $files; do
    if grep -q 'snippets/cashpay-careers.conf' "$f"; then echo "Déjà présent dans $f"; continue; fi
    cp -a "$f" "$f.bak-careers"
    sed -i -E "/server_name([^;]*[[:space:]])?${DOMAIN//./\\.}([[:space:]][^;]*)?;/a\\    include snippets/cashpay-careers.conf;" "$f"
    changed="$changed $f"
done
if nginx -t; then
    systemctl reload nginx && echo "nginx rechargé."
else
    for f in $changed; do mv -f "$f.bak-careers" "$f"; done
    die "nginx a refusé la configuration : modifications annulées. Rien n'a été cassé."
fi
for f in $changed; do rm -f "$f.bak-careers"; done

say "5/5 Vérification"
sleep 2
curl -fsS "http://127.0.0.1:${PORT_USED}/api/careers/health" && echo
printf '\n\033[1;32m✔ Terminé.\033[0m Testez : curl https://%s/api/careers/health  (doit afficher "smtp":true)\nLogs : pm2 logs %s\n' "$DOMAIN" "$APP"
