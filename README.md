# CashPay All — Site vitrine (cashpay-main)

Site statique (HTML / CSS / JS, sans build) bilingue **FR / EN**, vitrine de l'écosystème CashPay All et de FINUSECO SARL.
Déployé sur `https://cashpay-all.com`.

## Pages (routes)
| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : services de conception, services, application, espace développeur, cartes B2B, téléchargements |
| `services.html` | Les 20 services avec filtres par catégorie |
| `ateliers.html` | Atelier de conception & ingénierie des systèmes + atelier de génie logiciel, méthode, réalisations |
| `developpeurs.html` | Synthèse du portail développeur (API, intégration du paiement, exemple de requête, tarifs) |
| `cartes-b2b.html` | Cartes prépayées B2B Visa & Mastercard, modèle JIT, cas d'usage |
| `apropos.html` | À propos de l'application CashPay All |
| `entreprise.html` | À propos de FINUSECO SARL : profil, marques, direction |
| `contact.html` | Formulaire (e-mail ou WhatsApp) et coordonnées |
| `recrutement.html` | Offres par pays, province et poste ; candidature avec CV |

## Sections clés (accueil)
- **Atelier de génie logiciel** (`#genie-logiciel`) : ordinateur qui code en animation (`js/main.js`, bloc « Ordinateur qui code »), types d'applications, VPS.
- **Intégration du paiement** (`#integration`) : collecte et décaissement pour applications e-commerce et fintech, liens vers le portail développeur.
- **SMS & WhatsApp** (`#messagerie`) : passerelles pour développeurs, liens vers la documentation.

- **Transfert international animé** (`#transfert`, `js/xfer.js`) : deux téléphones recomposés en HTML/CSS (Kinshasa → Paris). L'animation se lance au toucher de « Envoyer Transfert », du bouton « Lancer le transfert », ou à l'arrivée dans l'écran. Montants fictifs (constantes `DEMO` en haut du fichier).

## Images de l'application et des cartes
- `public/images/app-home-cdf.webp` / `app-home-usd.webp` : captures de l'application, affichées dans un cadre de téléphone en CSS (classe `.device`) sur l'accueil et « À propos ». Pour mettre à jour l'app, remplacer ces deux fichiers (720 × 1612 px).
- `public/images/card-green|gold|red.webp` : cartes CashPay Visa en portrait (fond transparent), éventail `.cards-fan` sur l'accueil et la page Cartes B2B.

## Fichiers partagés
- `css/style.css` : design system (couleurs, composants, animations, responsive).
- `js/layout.js` : en-tête, pied de page et bouton WhatsApp flottant (+243 85 386 80 21) injectés dans toutes les pages.
- `js/i18n.js` : moteur FR/EN. Le français est le texte du HTML ; l'anglais est dans le dictionnaire `EN`.
- `js/services-data.js` : liste des services (une seule source, FR + EN) affichée sur l'accueil et sur `services.html`.
- `js/xfer.js` : section de transfert animée (page d'accueil uniquement).
- `js/main.js` : langue, menu, animations au défilement, compteurs, filtres, formulaire de contact.

## Modifier un texte
Chaque texte porte `data-i18n="clé"`. Changer le français dans le HTML, l'anglais dans `js/i18n.js` (ou `js/services-data.js` pour les services).

## Images
- `public/images/` : logos et visuels. `logo1.png` (bleu) pour l'en-tête, `logo.png` (blanc) pour le pied de page et les cartes.
- Photos de la direction (optionnelles) : `public/images/team/patrick-lubanda.jpg` et `public/images/team/gary-zita.jpg`. Sans photo, les initiales s'affichent.
- `public/downloads/` : APK et EXE (non versionnés, à placer sur le serveur).

## Liens
- Application web : `https://app.cashpay-all.com`
- Portail développeurs : `https://developer.cashpay-all.com`
- E-mail : `info@cashpay-all.com`

## FAQ, direction et témoignages
- `faq.html` : questions fréquemment posées (contenu et traductions dans `js/faq-data.js`, captures dans `public/images/faq/`).
- `entreprise.html` : direction avec photos (`public/images/team/` : patrick-lubanda, gary-zita, assistante).
- Témoignages : tableau `TESTIMONIALS` de `js/faq-data.js` (vide = invitation à envoyer un témoignage ; n'y mettre que de vrais témoignages).

## Recrutement

La page `recrutement.html` reprend le design du site et ajoute un parcours pays → province → poste, puis un dossier de candidature avec CV PDF et documents complémentaires. Les candidatures sont ouvertes pour les 26 provinces de RDC et les huit profils du catalogue ; les autres pays africains sont indiqués comme non ouverts.

L’envoi utilise un petit service Node.js séparé, raccordé uniquement à `/api/recruitment/`. Le dossier est conservé hors du site public et notifié par SMTP à **info@cashpayall.com**, l’adresse de recrutement demandée sans tiret. Le formulaire de contact et ses coordonnées existantes restent inchangés.

Voir [l’installation et le fonctionnement du recrutement](docs/recrutement.md) pour le compte SMTP, le stockage privé, le raccordement Nginx et les services systemd. Le service doit être configuré sur le serveur après mise à jour du dépôt ; un `git pull` seul ne configure pas la messagerie. Aucun envoi SMTP réel n’a été exécuté pendant les tests.
