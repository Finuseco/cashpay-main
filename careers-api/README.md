# Service « Carrières » (candidatures → info@cashpay-all.com)

Petit service Node.js (une seule dépendance : `nodemailer`) qui reçoit le formulaire de `emplois.html`,
vérifie les champs et les fichiers (CV PDF/DOC/DOCX, 5 Mo max), garde une copie sur le disque,
puis envoie un e-mail avec les pièces jointes à **info@cashpay-all.com**.

Données du formulaire (pays, provinces, postes) : `../js/jobs-data.json` — pour ajouter un poste ou une province, modifier ce fichier seulement.

## Installation en UNE commande (recommandé)
```bash
cd /var/www/cashpay-all/cashpay-main && git pull origin main && bash careers-api/install.sh
```
Le script copie les réglages SMTP du portail développeur, installe, démarre le service avec pm2 et ajoute la route dans nginx
(avec test `nginx -t` et retour arrière automatique en cas d'erreur). Il peut être relancé sans risque.

## Installation manuelle (équivalent, une fois)
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

## Accusé de réception automatique
Après chaque candidature valide, le candidat reçoit un e-mail professionnel (français ou anglais selon la langue du site) avec sa référence,
un récapitulatif et les prochaines étapes. Expéditeur : `noreply@cashpay-all.com` (variable `MAIL_NOREPLY`) ; les réponses vont à `info@cashpay-all.com`.
- Par défaut l'envoi passe par le compte SMTP principal : le serveur de messagerie doit autoriser d'écrire « de la part de » noreply@ (alias ou boîte existante).
- S'il refuse, créer la boîte `noreply@cashpay-all.com` et ajouter dans `/etc/cashpay-careers.env` : `NOREPLY_SMTP_USER=noreply@cashpay-all.com` et `NOREPLY_SMTP_PASSWORD=…`
  (`NOREPLY_SMTP_HOST` / `NOREPLY_SMTP_PORT` si différents), puis `pm2 restart cashpay-careers`.
- Si l'accusé échoue, la candidature n'est pas perdue : elle arrive quand même à info@ ; l'erreur est dans `pm2 logs cashpay-careers` (`accusé de réception non envoyé`).

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
types de fichiers vérifiés sur le contenu ; l'accusé de réception n'est envoyé qu'après une candidature complète et valide (CV vérifié), avec les limites ci-dessus, pour éviter qu'on s'en serve pour spammer des tiers.


## Champs du formulaire (mise à jour)
Nom, prénom, sexe (M/F), âge, profession, téléphone, e-mail, ville, **photo de profil obligatoire** (JPG/PNG/WEBP, 3 Mo), CV (PDF/DOC/DOCX, 5 Mo), documents (3 max), message. Pas de liste de niveau d'études : il figure dans le CV. La photo est affichée dans l'e-mail interne.
