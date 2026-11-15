# Service « Carrières » (candidatures → info@cashpay-all.com)

Petit service Node.js (une seule dépendance : `nodemailer`) qui reçoit le formulaire de `emplois.html`,
vérifie les champs et les fichiers (CV PDF/DOC/DOCX, 5 Mo max), garde une copie sur le disque,
puis envoie un e-mail avec les pièces jointes à **info@cashpay-all.com**.

Données du formulaire (pays, provinces, postes) : `../js/jobs-data.json` — pour ajouter un poste ou une province, modifier ce fichier seulement.

## Installation sur le serveur (une fois)
```bash
cd /var/www/cashpay-all/cashpay-main/careers-api && npm install --omit=dev

# Réglages (HORS du dossier du site, jamais dans git). On reprend les lignes SMTP du portail développeur :
grep '^SMTP_' /var/www/cashpay-all/developer/.env > /etc/cashpay-careers.env
cat >> /etc/cashpay-careers.env <<'ENV'
MAIL_TO=info@cashpay-all.com
TRUST_PROXY=1
PORT=8010
ENV
chmod 600 /etc/cashpay-careers.env

pm2 start server.js --name cashpay-careers && pm2 save
```
Variables : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (obligatoires pour l'e-mail), `MAIL_TO`, `MAIL_FROM` (défaut : SMTP_USER),
`DATA_DIR` (défaut `/var/lib/cashpay-careers`), `PORT` (défaut 8010), `TRUST_PROXY=1` derrière nginx.

## nginx (dans le bloc `server` de cashpay-all.com)
```nginx
location /api/careers {
    client_max_body_size 25m;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header X-Forwarded-For $remote_addr;
}
# Ne jamais exposer le code du service ni les fichiers cachés
location ^~ /careers-api/ { return 404; }
location ~ /\.(?!well-known) { deny all; }
```
Puis : `nginx -t && systemctl reload nginx`.

## Vérifier
`curl https://cashpay-all.com/api/careers/health` → `{"ok":true,"smtp":true,"dataDir":true}`
Logs : `pm2 logs cashpay-careers`. Les candidatures sont aussi dans `DATA_DIR/AAAA-MM/<référence>/` (JSON + fichiers).

## Sécurité
Limites : 6 envois/heure par adresse IP, 3 candidatures/jour par e-mail ; champ piège anti-robots ; délai minimal de remplissage ;
types de fichiers vérifiés sur le contenu ; aucune réponse automatique envoyée aux candidats (évite l'usage du serveur pour spammer des tiers).
