# Service Carrières de CashPay Main

Le service Node.js reçoit le formulaire de `emplois.html`, valide les champs et les pièces jointes,
conserve le dossier hors du site puis transmet la candidature au destinataire interne et un accusé de réception au candidat.
Les dépendances sont `nodemailer` et `pg` ; PostgreSQL reste facultatif.

## Mise à jour du service existant

Depuis le dépôt installé sur le serveur :

```bash
cd /var/www/cashpay-all/main
npm --prefix careers-api install --omit=dev
pm2 restart cashpay-careers --update-env
```

`cashpay-careers` est le nom défini dans `install.sh`. Le redémarrage concerne uniquement ce service.
La correction utilise les identifiants déjà configurés ; elle ne nécessite pas de changer les mots de passe des autres applications.
`install.sh` sert à une installation initiale et configure également nginx ; il n'est pas nécessaire pour ce simple redémarrage.

## Configuration et priorité SMTP

Le fichier du service est `/etc/cashpay-careers.env`, ou celui désigné par `CAREERS_ENV_FILE` dans l'environnement du processus.
Il doit rester hors du dossier public, avec des permissions `600` et un propriétaire permettant sa lecture par le service.

Par défaut, les clés `SMTP_*`, `NOREPLY_SMTP_*` et `MAIL_*` présentes dans ce fichier ont priorité sur les valeurs héritées du processus,
y compris d'anciennes valeurs conservées par PM2. Les autres variables du fichier complètent uniquement les variables absentes du processus.
Le chargement produit une configuration locale au service et ne modifie pas les fichiers des autres applications.

Pour conserver explicitement la priorité de l'environnement du processus, définir `CAREERS_ENV_PRIORITY=process` dans cet environnement
ou dans le fichier du service, puis redémarrer `cashpay-careers` avec `--update-env`.
Les mots de passe sont résolus par source prioritaire, puis par nom : `SMTP_PASSWORD` avant son alias `SMTP_PASS`,
et `NOREPLY_SMTP_PASSWORD` avant `NOREPLY_SMTP_PASS`. Ainsi, en priorité fichier, un alias du fichier remplace aussi un ancien
mot de passe canonique du processus. Une valeur canonique explicitement vide ne déclenche pas de substitution par un alias de la même source.

| Variable | Usage / défaut |
| --- | --- |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | Serveur et compte authentifié pour l'envoi interne |
| `SMTP_PORT` | `587` ; `465` active TLS dès la connexion, les autres ports imposent STARTTLS |
| `MAIL_TO` | Destinataire interne ; défaut `info@cashpay-all.com`, plusieurs adresses possibles séparées par des virgules |
| `MAIL_FROM` | Expéditeur interne ; défaut `SMTP_USER` |
| `MAIL_NOREPLY` | Expéditeur de l'accusé ; défaut compte SMTP effectivement utilisé pour cet envoi |
| `NOREPLY_SMTP_USER`, `NOREPLY_SMTP_PASSWORD` | Compte dédié facultatif aux accusés de réception |
| `NOREPLY_SMTP_HOST`, `NOREPLY_SMTP_PORT` | Serveur/port du compte dédié ; défaut serveur/port principal |
| `DATA_DIR` | Dossiers de candidature ; défaut `/var/lib/cashpay-careers` |
| `HOST`, `PORT` | Écoute locale ; défaut `127.0.0.1:8010` |
| `TRUST_PROXY` | `1` derrière nginx pour utiliser l'adresse transmise par le proxy |

Le parseur utilisé est `envfile.js`. Les valeurs entre guillemets simples restent littérales, notamment les caractères `$` et `#`.
Conserver les valeurs réelles déjà configurées ; le diagnostic n'affiche aucun mot de passe, empreinte ou longueur.

`SMTP_USER` désigne le compte qui s'authentifie ; `MAIL_TO` désigne la destination et peut être une redirection.
Ces adresses peuvent être différentes. Un `MAIL_FROM` ou `MAIL_NOREPLY` différent du compte authentifié est conservé :
il faut que le fournisseur autorise cet alias expéditeur. Une différence seule ne prouve pas la cause d'un échec.

## Diagnostic sans envoi d'e-mail

```bash
cd /var/www/cashpay-all/main
bash careers-api/diagnose.sh
bash careers-api/diagnose.sh --json
```

Le script appelle `check-mail.js` : il lit uniquement la configuration de ce service et utilise `verify()` pour vérifier
la connexion SMTP et l'authentification. Il n'appelle jamais `sendMail()`, ne modifie aucun fichier ni processus,
et ne lit pas la configuration des autres applications. Les délais de connexion et de vérification sont limités à dix secondes par compte.
Si les accusés réutilisent le compte principal, celui-ci n'est vérifié qu'une fois ; un compte dédié est vérifié indépendamment.

Le rapport indique les sources `file`, `process` ou `missing` des clés de messagerie, les adresses utiles et des codes d'erreur limités
(`EAUTH`, `ETIMEDOUT`, etc.), sans copier les messages d'erreur bruts du fournisseur. Le code de sortie vaut `0` si les vérifications
réussissent, `1` si la configuration ou la vérification est en échec, et `2` pour une erreur d'utilisation ou une erreur inattendue.
L'ancienne syntaxe avec une adresse de test n'est plus prise en charge : aucun message de test n'est envoyé.

Une authentification acceptée ne prouve pas la remise d'un message dans la boîte finale ni le fonctionnement d'une redirection.
De même, un message accepté par le serveur SMTP peut ensuite être filtré ou rejeté. Pour une candidature déjà soumise,
la référence et l'heure permettent de vérifier les journaux de livraison chez le fournisseur, la redirection et les indésirables.
SPF, DKIM et DMARC se contrôlent dans la configuration du domaine et du fournisseur si la remise finale échoue.

`GET /api/careers/health` expose la disponibilité du service, la présence de configuration et le dernier résultat d'envoi.
La présence d'une configuration SMTP n'est pas un test d'authentification ni une preuve de livraison.

## Résultat d'une soumission et reprises

| Réponse HTTP | Résultat |
| --- | --- |
| `200` | Le serveur SMTP a accepté l'envoi interne. L'état distinct de l'accusé indique s'il a aussi été accepté ou reste en attente. |
| `202` | Le dossier est enregistré sur disque ; la notification interne attend encore son acceptation SMTP. La référence est conservée. |
| `503` | Le dossier n'a pas pu être enregistré et l'envoi interne n'a pas été accepté. Le formulaire conserve les données pour réessayer. |

L'interface distingue l'envoi complet, l'accusé encore en attente et la notification interne en attente.
Une sauvegarde sur disque seule n'affiche plus un succès d'envoi. Après une réponse `202`, éviter de soumettre à nouveau le même dossier :
le service reprend les envois en attente à partir du dossier enregistré.

Chaque nouvelle candidature enregistrée se trouve dans `DATA_DIR/AAAA-MM/<référence>/` avec `candidature.json`, les pièces jointes
et `mail-delivery.json`. Ce dernier garde séparément les états `internal` et `acknowledgement`, les destinataires déjà acceptés,
le nombre de tentatives et la prochaine échéance. Les deux envois sont indépendants : un accusé peut fonctionner avec son compte dédié
même si le compte interne est indisponible, et un envoi déjà accepté n'est pas répété lors de la reprise de l'autre.

Les échecs SMTP sont repris automatiquement, jusqu'à huit tentatives par type d'envoi, avec un délai croissant de une minute
jusqu'à une heure. Après épuisement, l'état demande une vérification manuelle. Les dossiers historiques dépourvus de `mail-delivery.json`
ne sont jamais renvoyés automatiquement. Les dossiers et leur état persistent après un redémarrage du service.
Si l'état des envois ne peut pas être enregistré, `retryScheduled: false` signale que la reprise n'est pas garantie :
l'interface demande de contacter le recrutement avec la référence. Le journal du service signale la référence à vérifier.
Conserver une seule instance PM2 de ce service (mode fork de `install.sh`) : la protection contre les reprises simultanées est locale au processus.
Une interruption entre l'acceptation SMTP et son écriture sur disque peut encore provoquer un doublon ; l'identifiant du message reste stable pour faciliter le suivi.

## Formulaire et stockage

Les pays, provinces et postes proviennent de `../js/jobs-data.json`.
Champs : nom, prénom, sexe, âge, profession, téléphone, e-mail, ville, message et consentement.
Pièces : photo obligatoire JPG/PNG/WEBP de 3 Mo maximum, CV PDF/DOC/DOCX de 5 Mo maximum et trois documents supplémentaires au maximum.
Le contenu des fichiers est vérifié en plus de leur extension.

Limites : six candidatures par heure et par adresse IP, trois par jour et par adresse e-mail, champ piège et délai minimal de remplissage.
Les dossiers ne doivent pas être exposés par nginx.

## nginx

Dans le bloc `server` du domaine :

```nginx
location /api/careers {
    client_max_body_size 25m;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header X-Forwarded-For $remote_addr;
}
location ^~ /careers-api/ { return 404; }
location ~ /\.(?!well-known) { deny all; }
```

Adapter le port si nécessaire et vérifier `nginx -t` avant un rechargement de nginx.

## PostgreSQL facultatif

La migration existante `cashpay_web/migrations/20261117_career_applications.sql` définit `career_applications` et `career_email_log`.
Une connexion déjà disponible peut être renseignée dans le fichier propre à Carrières avec `DATABASE_URL`,
ou `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` et éventuellement `DB_PORT`/`DB_SSL_CA`.
Les valeurs présentes dans l'environnement du processus gardent leur priorité pour ces variables.
La sauvegarde PostgreSQL et son journal complètent les dossiers sur disque ; une panne de la base ne doit pas perdre une candidature enregistrée.

Le suivi existant dans CashPay Web utilise `GET/PATCH /api/internal/careers` avec l'en-tête `x-internal-job-secret`.
Cette correction de messagerie ne modifie pas cette application.
