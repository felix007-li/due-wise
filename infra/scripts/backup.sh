#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${BACKUP_RECIPIENT:?Set an age public recipient}"
: "${PGHOST:?Set PostgreSQL host}" "${PGUSER:?Set PostgreSQL user}" "${PGDATABASE:?Set PostgreSQL database}"
command -v age >/dev/null
command -v pg_dump >/dev/null
mkdir -p .local/backups
# Only completed pipelines receive the discoverable .dump.age suffix.
# A unique temporary name also prevents same-second runs overwriting backups.
pending_file=$(mktemp ".local/backups/duewise-$(date -u +%Y%m%dT%H%M%SZ).XXXXXX")
trap 'rm -f "$pending_file"' EXIT
backup_file="${pending_file}.dump.age"
# libpq reads operator-provided credentials; never echo them or put them on the command line.
pg_dump --format=custom --no-owner --no-acl | age -r "$BACKUP_RECIPIENT" -o "$pending_file"
test -s "$pending_file"
mv "$pending_file" "$backup_file"
printf 'Encrypted backup created: %s\n' "$backup_file"
