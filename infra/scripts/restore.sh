#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${PGDATABASE:?Set an isolated restore database}"
: "${AGE_IDENTITY:?Provide the operator-managed age identity path}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE to the target database name}"
if [[ "$CONFIRM_RESTORE" != "$PGDATABASE" || "$PGDATABASE" != duewise_restore_* ]]; then
  echo 'Restore is restricted to explicitly confirmed duewise_restore_* databases.' >&2
  exit 1
fi
[[ $# -eq 1 && -f "$1" ]] || { echo 'Usage: restore.sh encrypted.dump.age' >&2; exit 1; }
mkdir -p .local/restore
restore_file=$(mktemp .local/restore/restore.XXXXXX)
trap 'rm -f "$restore_file"' EXIT
age -d -i "$AGE_IDENTITY" "$1" > "$restore_file"
pg_restore --list "$restore_file" >/dev/null
pg_restore --exit-on-error --no-owner --no-acl --dbname="$PGDATABASE" "$restore_file"
echo 'Restore completed. Run row-count, ownership and golden-fixture smoke checks before promotion.'
