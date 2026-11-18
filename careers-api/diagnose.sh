#!/usr/bin/env bash
# Diagnostic SMTP en lecture seule : aucun message envoyé, aucune configuration modifiée.
# Usage : bash careers-api/diagnose.sh [--json]
# Fichier spécifique : CAREERS_ENV_FILE=/chemin/carrieres.env bash careers-api/diagnose.sh
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
exec node ./check-mail.js "$@"
