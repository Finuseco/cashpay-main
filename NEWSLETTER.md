# Main : newsletter et espace éditorial

Cette application reste une vitrine statique, sans nouveau backend ni secret.
Elle utilise `https://app.cashpay-all.com/api/main` dans CashPay Web.

- `newsletter.html` : inscription et confirmation/désinscription par lien mail.
- `articles.html` : catalogue, recherche et filtres ; `article.html?slug=…` : lecture.
- `index.html` : une seule publication récente ; liens vers le catalogue.
- `dashboard.html` : accès par l’icône de connexion du menu, puis authentification administrateur Wallet ID → OTP → PIN, éditeur,
  publications programmées, suivi des newsletters, contacts et réponses.
- Footer partagé : services/financement/écosystème, puis entreprise/aide/FAQ,
  avec accès permanent à la newsletter. Popup accessible après 6 secondes,
  reporté 7 jours si fermé ; le bouton du footer reste disponible.

Déployer d'abord les API, la migration SQL et la tâche cron documentées dans
`cashpay_web/docs/main-editorial.md`. Ensuite déployer les fichiers statiques
Main depuis GitHub, avec leurs nouveaux scripts et styles. Le changement de
version du script partagé recharge la navigation et le footer. Les pages et
formulaires de financement existants restent disponibles.

Les cookies d'administration sont limités au sous-domaine API et envoyés via
`credentials: include`. Les OTP/PIN/sessions ne sont pas conservés dans le stockage
local du navigateur. Les préférences d'affichage de la popup sont locales.
Un contrôle visuel de bureau et mobile ainsi qu'un essai du parcours complet en
préproduction restent nécessaires avant mise en ligne.
