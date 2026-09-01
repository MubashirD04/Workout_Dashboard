#!/usr/bin/env bash
# Encrypt/decrypt local .env files with sops+age so they can be committed
# and synced across devices without ever putting plaintext secrets in git.
#
# Setup on a new device:
#   1. Install sops (https://github.com/getsops/sops) and age (https://github.com/FiloSottile/age)
#   2. Get the age private key (stored in Bitwarden) and save it to:
#        ~/.config/sops/age/keys.txt
#   3. Run: scripts/sync-env.sh pull
#
# After editing a local .env file, run: scripts/sync-env.sh push
# then commit the changed files under secrets/.

set -euo pipefail
cd "$(dirname "$0")/.."

AGE_RECIPIENT="age1hlys9mvee80wekaaawd3gntte4m3fxpyq3xt4mhxlx739nvw2f7sekhs2q"

# plaintext path -> encrypted path (kept in sync, index-aligned)
PLAIN=(".env" ".env.local" "client/.env")
ENC=("secrets/env.enc" "secrets/env.local.enc" "secrets/client.env.enc")

usage() {
  echo "Usage: $0 {push|pull}"
  echo "  push  encrypt local plaintext .env files into secrets/*.enc (commit these)"
  echo "  pull  decrypt secrets/*.enc into local plaintext .env files (never commit these)"
  exit 1
}

[ $# -eq 1 ] || usage

mkdir -p secrets

case "$1" in
  push)
    for i in "${!PLAIN[@]}"; do
      plain="${PLAIN[$i]}"
      enc="${ENC[$i]}"
      if [ -f "$plain" ]; then
        sops --input-type dotenv --output-type dotenv --age "$AGE_RECIPIENT" -e "$plain" > "$enc"
        echo "encrypted $plain -> $enc"
      else
        echo "skip $plain (not found)"
      fi
    done
    ;;
  pull)
    for i in "${!PLAIN[@]}"; do
      plain="${PLAIN[$i]}"
      enc="${ENC[$i]}"
      if [ -f "$enc" ]; then
        sops --input-type dotenv --output-type dotenv -d "$enc" > "$plain"
        echo "decrypted $enc -> $plain"
      else
        echo "skip $enc (not found)"
      fi
    done
    ;;
  *)
    usage
    ;;
esac
