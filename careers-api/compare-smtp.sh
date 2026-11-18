#!/usr/bin/env bash
# Compare à une application PM2 sans afficher de secret ni modifier sa configuration.
# Usage : bash careers-api/compare-smtp.sh [nom-application-pm2]
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
exec node ./compare-smtp.js "$@"
