#!/bin/sh
# Force les navigateurs / Cloudflare à recharger css et js : ajoute ?v=<horodatage> aux liens de tous les *.html.
# À lancer avant chaque « git push » : sh bump-version.sh
cd "$(dirname "$0")" || exit 1
V=$(date +%Y%m%d%H%M%S)
for f in *.html; do
  sed -i -E "s#(href=\"css/[A-Za-z0-9_.-]+\.css)(\?v=[0-9]+)?\"#\1?v=$V\"#g; s#(src=\"js/[A-Za-z0-9_.-]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" "$f"
done
echo "Version des fichiers : $V"
