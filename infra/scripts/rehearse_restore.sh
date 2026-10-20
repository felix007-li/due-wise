#!/usr/bin/env bash
# Run only inside an isolated QA PostgreSQL container containing synthetic data.
set -euo pipefail
: "${PGUSER:?}" "${PGDATABASE:?}" "${DUEWISE_SYNTHETIC_QA_ONLY:?}"
[[ "$DUEWISE_SYNTHETIC_QA_ONLY" == yes && "$PGDATABASE" == duewise_qa ]] || exit 1
umask 077
rehearsal_dir=$(mktemp -d /tmp/duewise-restore-qa.XXXXXX)
cd "$rehearsal_dir"
age-keygen -o identity 2>keygen.log
export AGE_IDENTITY="$PWD/identity"
export BACKUP_RECIPIENT
BACKUP_RECIPIENT=$(age-keygen -y identity)
source_database=$PGDATABASE
export PGHOST=localhost
bash /tmp/backup.sh
backup_file=$(find .local/backups -name '*.dump.age' -type f)
# Verify the artifact is encrypted and cannot be mistaken for a plaintext custom dump.
head -c 22 "$backup_file" | diff - <(printf 'age-encryption.org/v1\n')
export PGDATABASE="duewise_restore_qa_$(date +%s)"
export CONFIRM_RESTORE=$PGDATABASE
createdb "$PGDATABASE"
start_seconds=$(date +%s)
bash /tmp/restore.sh "$backup_file"
restore_seconds=$(( $(date +%s) - start_seconds ))
mapfile -t tables < <(psql -d "$source_database" -Atc "select tablename from pg_tables where schemaname='public' order by tablename")
for table in "${tables[@]}"; do
  query="select count(*)::text || ':' || coalesce(md5(string_agg(row_to_json(t)::text, '' order by row_to_json(t)::text)), 'empty') from \"$table\" t"
  original=$(psql -d "$source_database" -Atc "$query")
  restored=$(psql -d "$PGDATABASE" -Atc "$query")
  [[ "$original" == "$restored" ]] || { echo "Mismatch: $table" >&2; exit 1; }
  printf '%s %s\n' "$table" "$original"
done
[[ -z $(find .local/restore -type f -print -quit) ]]
printf 'PASS: all %s tables match by row count and deterministic row digest; restoreSeconds=%s; plaintext cleanup verified\n' "${#tables[@]}" "$restore_seconds"
