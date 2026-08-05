#!/usr/bin/env bash
# Verifie que le deploiement qui vient d'avoir lieu repond reellement, avant
# de le considerer reussi. /api/library et /api/suggest exigent une session
# (voir api/library.ts, api/suggest.ts) : un 401 y est donc le signe que la
# fonction est deployee et s'execute normalement, pas une panne. Un statut
# 5xx ou une absence de reponse indique en revanche un deploiement casse.
set -u

base_url="${1:?URL de deploiement manquante}"
base_url="${base_url%/}"

failed=0

check() {
  local method="$1" path="$2" expected="$3"
  local status
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --max-time 10 --request "$method" "$base_url$path")

  if [ "$status" = "$expected" ]; then
    echo "[OK]     $method $path -> $status"
  else
    echo "[ECHEC]  $method $path -> $status (attendu $expected)"
    failed=1
  fi
}

check GET "/" 200
check GET "/api/library" 401
check POST "/api/suggest" 401

if [ "$failed" -ne 0 ]; then
  echo "::error::Smoke test post-deploiement en echec sur $base_url. Voir docs/04-deploiement-et-rollback.md pour revenir a la version precedente."
  exit 1
fi

echo "Smoke test OK sur $base_url"
