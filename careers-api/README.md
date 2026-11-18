# Candidatures envoyées directement par CashPay Web

Le formulaire de Main utilise exclusivement :

```http
POST https://app.cashpay-all.com/api/careers
```

CashPay Web reçoit le formulaire et les pièces jointes en mémoire, transmet le message au destinataire de recrutement,
puis traite séparément l’accusé au candidat. Il n’enregistre aucun dossier, fichier, journal de candidature ou tâche d’envoi en base/disque.
Le mot de passe du destinataire `info@cashpay-all.com` n’est jamais demandé. Les autorisations d’envoi existantes de CashPay Web restent côté serveur.

Le succès exige l’acceptation SMTP du message interne. Si elle échoue, le formulaire et les fichiers sélectionnés restent dans le navigateur.
Un accusé refusé après acceptation interne affiche une confirmation partielle et ne demande pas de soumettre à nouveau le dossier.

## Déploiement

Déployer d’abord la route Next.js selon `docs/careers-mail-only.md` du dépôt CashPay Web, vérifier son CORS et sa configuration nginx,
puis mettre à jour Main. Le cache-buster de `js/jobs.js` est actualisé uniquement sur `emplois.html`.
Arrêter ensuite le service local :

```bash
pm2 stop cashpay-careers
pm2 save
```

Ne pas arrêter les autres applications PM2. Aucun nouveau processus n’est nécessaire pour Main.
`install.sh` est retiré : il ne copie plus de configuration SMTP, n’installe rien et ne modifie pas nginx.
Si l’ancien `server.js` est démarré manuellement, il répond `410 endpoint_moved`, ne conserve aucun dossier et ne lance aucune reprise.
Les outils SMTP historiques présents dans ce dossier ne sont plus utilisés par le formulaire ni par la nouvelle route Next.js.

Les dossiers précédemment créés sous `/var/lib/cashpay-careers` ne sont ni renvoyés ni supprimés par cette mise à jour.
La configuration nginx propre à la route sur `app.cashpay-all.com` doit désactiver le tampon disque des requêtes, comme indiqué dans la documentation Web.
Sur Main, remplacer aussi l'ancienne règle proxy `/api/careers` par une réponse immédiate `410`, pour éviter les uploads résiduels d'anciens formulaires en cache.
