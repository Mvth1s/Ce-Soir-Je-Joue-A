#!/usr/bin/env bash
# Envoie une notification Discord en cas d'echec de pipeline. Ne fait jamais
# echouer le job appelant : une notification manquante ne doit pas masquer
# l'echec reel qui l'a declenchee. Si DISCORD_WEBHOOK_URL n'est pas
# configure, se contente d'un avertissement dans les logs.
set -u

message="${1:?message manquant}"
ref_name="${2:?ref_name manquant}"
run_url="${3:?run_url manquant}"

if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
  echo "::warning::DISCORD_WEBHOOK_URL n'est pas configure : notification ignoree."
  exit 0
fi

payload=$(printf '{"content": "%s (branche `%s`)\\n%s"}' \
  "$(printf '%s' "$message" | sed 's/"/\\"/g')" \
  "$(printf '%s' "$ref_name" | sed 's/"/\\"/g')" \
  "$run_url")

curl --fail --silent --show-error \
  -H "Content-Type: application/json" \
  -X POST \
  -d "$payload" \
  "$DISCORD_WEBHOOK_URL" \
  || echo "::warning::L'envoi de la notification Discord a echoue."
