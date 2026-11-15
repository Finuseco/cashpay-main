# Recrutement CashPay All

La page `recrutement.html` s’ajoute au site statique existant. Son backend fonctionne dans un service Node.js séparé ; le formulaire de contact, les pages et les coordonnées déjà publiées restent inchangés.

## Parcours de candidature

1. Choisir le pays. Le catalogue contient les 54 pays africains ; les candidatures sont actuellement ouvertes pour la République démocratique du Congo.
2. Choisir l’une des 26 provinces de RDC.
3. Choisir le poste et consulter sa description.
4. Renseigner son identité, son e-mail, son téléphone et son message. Le post-nom et l’âge sont facultatifs.
5. Joindre un CV au format PDF et, si nécessaire, jusqu’à trois documents PDF supplémentaires. Un fichier est limité à 5 Mio et l’ensemble des pièces à 15 Mio.
6. Accepter le traitement du dossier pour le recrutement et envoyer la candidature.

Les postes du catalogue sont proposés pour chaque province : manager général, expert-comptable, trésorier, directeur des ressources humaines, directeur marketing, directeur commercial, délégué commercial et agent commercial. Aucun salaire, calendrier ou critère d’éligibilité non confirmé n’est annoncé.

Les textes français et anglais des pays, postes, descriptions et missions se trouvent dans `recruitment/catalog.json`. Les provinces et les identifiants des postes sont vérifiés côté serveur ; modifier un champ depuis le navigateur ne permet pas de créer une candidature hors du catalogue autorisé. Pour ouvrir un autre pays, ajouter ses subdivisions puis activer explicitement son champ `available`.

## Dossiers et messages

Chaque candidature reçue devient un dossier privé contenant les données structurées, le CV, les autres pièces et un récapitulatif `candidature.txt`. Ce récapitulatif et les documents sont joints au message destiné au recrutement. L’e-mail du candidat est utilisé comme adresse de réponse ; l’expéditeur et le destinataire proviennent de la configuration serveur.

La destination demandée est **`info@cashpayall.com`**, sans tiret. Le site existant utilise également `info@cashpay-all.com` dans ses coordonnées générales : ces coordonnées ne sont pas remplacées par cet ajout. Vérifier que la boîte de recrutement sans tiret reçoit les messages avant l’ouverture des candidatures.

La réponse du formulaire distingue deux situations :

- `201` avec `emailStatus: "sent"` : le dossier est enregistré et le serveur SMTP a accepté le message. Cette acceptation n’est pas une preuve de lecture ou de remise dans la boîte finale.
- `202` avec `emailStatus: "pending"` : le dossier est enregistré, mais la notification est en attente de relance.

Si le SMTP n’est pas configuré ou si le dossier ne peut pas être enregistré, le service renvoie une erreur explicite ; il ne prétend pas avoir envoyé la candidature. La référence permet à l’équipe de retrouver le dossier dans le stockage privé. Aucune route publique ne permet de consulter les dossiers ou de télécharger les pièces.

Une clé d’idempotence accompagne chaque soumission. Un nouvel essai avec la même clé et le même contenu retrouve le dossier existant ; une notification déjà acceptée retourne alors `200` sans nouvel envoi. La même clé avec un autre contenu est refusée. Les données personnelles ne sont pas placées dans le stockage local du navigateur.

## Installation du service

Le site existant reste servi comme auparavant. Les opérations suivantes sont à réaliser sur le serveur autorisé ; elles n’ont pas été exécutées sur `/var/www/cashpay-all/main` pendant le développement.

Prérequis : Node.js 22.9 ou plus récent, un compte de service non administrateur et un accès SMTP utilisable par ce compte de messagerie.

```bash
cd /var/www/cashpay-all/main
npm install --omit=dev
sudo useradd --system --home /var/lib/cashpay-recruitment --shell /usr/sbin/nologin cashpay-recruitment
sudo install -m 600 deploy/recruitment.env.example /etc/cashpay-recruitment.env
```

Si le compte de service existe déjà, ne pas le recréer. Renseigner ensuite `/etc/cashpay-recruitment.env`, hors du dépôt et du dossier web. Ne pas placer les secrets dans une commande destinée à être partagée.

| Variable | Utilisation |
| --- | --- |
| `HOST`, `PORT` | Écoute locale ; valeurs prévues : `127.0.0.1` et `3100` |
| `SITE_ORIGIN` | Origine HTTPS autorisée du formulaire, par exemple `https://cashpay-all.com` |
| `TRUST_PROXY_IPS` | Adresses exactes des mandataires autorisés ; boucle locale pour le Nginx proposé |
| `RECRUITMENT_DATA_DIR` | Dossier persistant privé, prévu à `/var/lib/cashpay-recruitment` |
| `RECRUITMENT_TO` | Destination des candidatures ; défaut demandé : `info@cashpayall.com` |
| `SMTP_HOST`, `SMTP_PORT` | Serveur SMTP et port 465 ou 587 |
| `SMTP_SECURE` | `true` pour TLS direct sur 465 ; `false` pour STARTTLS obligatoire sur 587 |
| `SMTP_USER`, `SMTP_PASS` | Identifiants de messagerie |
| `SMTP_FROM` | Expéditeur autorisé par le serveur SMTP |
| `RECRUITMENT_RETENTION_DAYS` | Durée utilisée par la purge ; défaut prévu : 180 jours |

Le service refuse les configurations qui désactivent la vérification TLS. `SITE_ORIGIN` doit correspondre à l’origine réellement utilisée par la page. Si le site accepte aussi `www.cashpay-all.com`, le faire rediriger vers l’origine configurée ou adapter explicitement la configuration avant ouverture.

Vérifier le chemin de Node.js avec `command -v node` sur le serveur, puis ajuster `ExecStart` dans les fichiers d’unité si le binaire n’est pas `/usr/bin/node`.

```bash
sudo install -m 644 deploy/recruitment.service /etc/systemd/system/
sudo install -m 644 deploy/recruitment-worker.service deploy/recruitment-worker.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now recruitment.service recruitment-worker.timer
```

`StateDirectory` crée le dossier d’état avec l’utilisateur du service. Le processus dispose d’un accès en écriture à ce dossier, pas au code du site. Si `RECRUITMENT_DATA_DIR` est changé, adapter aussi les chemins d’écriture et les droits dans les unités.

## Raccordement Nginx

Insérer `deploy/recruitment-nginx.conf` dans le bloc HTTPS existant du domaine. Ce fragment envoie uniquement `/api/recruitment/` vers Node.js et interdit l’accès HTTP aux sources serveur, tests et fichiers d’exploitation. Le catalogue public et les pages statiques restent accessibles. Ne pas remplacer le bloc `server` existant par ce fragment.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Le backend ne sert pas les fichiers du site. Sa route de santé est `/api/recruitment/health`, son catalogue `/api/recruitment/catalog` et son point de soumission `/api/recruitment/applications`. Le navigateur envoie les pièces avec `multipart/form-data`, la même origine et l’en-tête `X-Requested-With: XMLHttpRequest`.

## Relances, conservation et sauvegardes

Le service conserve une file de notifications durable. Le worker peut être exécuté manuellement avec l’environnement du service ou via le minuteur proposé :

```bash
npm run recruitment:work
```

Les erreurs SMTP entraînent une relance avec délai progressif, jusqu’à huit tentatives. Un identifiant de message stable et les verrous réduisent les doublons. SMTP ne fournit pas de transaction commune avec le stockage : une interruption après acceptation du message peut provoquer un doublon lors d’une relance. Ne pas supprimer un dossier en attente pour résoudre une panne SMTP ; corriger la configuration puis relancer le worker.

La purge est séparée de l’envoi :

```bash
npm run recruitment:cleanup
```

Définir la durée de conservation adaptée à votre recrutement avant de programmer la purge. Pour utiliser les unités fournies :

```bash
sudo install -m 644 deploy/recruitment-cleanup.service deploy/recruitment-cleanup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now recruitment-cleanup.timer
```

Sauvegarder le dossier privé des candidatures avec des accès restreints. Les dossiers et les pièces ne doivent jamais être copiés dans `public/`, placés sous la racine Nginx ou ajoutés à Git.

## Vérifications avant ouverture

Les tests applicatifs se lancent sans envoi de mail réel :

```bash
node --test test/recruitment*.test.mjs
```

Les 20 tests ont été exécutés avec succès pendant le développement. Ils couvrent le catalogue autorisé, les champs, les pièces PDF, l’idempotence y compris les appels concurrents, l’enregistrement privé, les états d’envoi ou d’attente, les refus SMTP et le nombre maximal de relances. Le transport SMTP y est simulé ; ils ne prouvent pas une remise réelle dans la boîte de réception. Après déploiement, vérifier les sélecteurs sur mobile et ordinateur, une candidature de test avec PDF, sa référence et la réception effective dans la boîte indiquée. Vérifier aussi une panne SMTP puis sa relance.

Le code SMTP ne constitue pas une configuration active de la boîte : ses paramètres et l’accès au serveur de production restent nécessaires. Aucun e-mail réel n’a été envoyé pendant la préparation de cette fonctionnalité.
