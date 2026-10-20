#!/usr/bin/env bash
# Applies ONE migration file to the database in $SUPABASE_DB_URL — in one transaction, and at most once
# (recorded in app_meta.applied_migrations). Used by .github/workflows/apply-sql.yml ("Áp dụng SQL").
#   scripts/apply-migration.sh <file name> <folder holding it>
#   e.g. scripts/apply-migration.sh 0012_p1_content_review.sql pr/supabase/migrations
set -euo pipefail

FILE="${1:?usage: apply-migration.sh <file> <dir>}"
DIR="${2:?usage: apply-migration.sh <file> <dir>}"
DB="${SUPABASE_DB_URL:?SUPABASE_DB_URL is not set}"
fail() { echo "::error::$1"; exit 1; }

[[ "$FILE" =~ ^([0-9]{4})_[a-z0-9_]+\.sql$ ]] || fail "Tên file không hợp lệ: '$FILE' (dạng 0012_ten_file.sql)."
NUM=$((10#${BASH_REMATCH[1]}))
# 0001–0010 were pasted into Supabase by hand before this button existed.
(( NUM > 10 )) || fail "$FILE đã được chạy tay trước đây — không chạy lại."
SQL="$DIR/$FILE"
[[ -f "$SQL" ]] || fail "Không thấy $FILE trên nhánh đã chọn."
grep -qiE '^[[:space:]]*(begin|commit|rollback|start transaction)[[:space:]]*;' "$SQL" \
  && fail "$FILE tự mở/đóng transaction — không chạy bằng nút này."
HASH=$(sha256sum "$SQL" | cut -c1-64)
SHA="${GIT_SHA:-local}"

# Bookkeeping table (idempotent), then: was this file already applied?
done_at=$(psql "$DB" -X -tA -q -v ON_ERROR_STOP=1 -c "
  set client_min_messages = warning;
  create schema if not exists app_meta;
  revoke all on schema app_meta from public;
  create table if not exists app_meta.applied_migrations (
    file text primary key,
    applied_at timestamptz not null default now(),
    git_sha text not null,
    sql_sha256 text not null
  );
  select coalesce((select applied_at::text from app_meta.applied_migrations where file = '$FILE'), '');")
[[ -z "$done_at" ]] || fail "$FILE đã chạy lúc $done_at — không chạy lại."

# One transaction: the bookkeeping row and the migration commit together, or nothing changes.
psql "$DB" -X -q -v ON_ERROR_STOP=1 <<SQLEOF
begin;
insert into app_meta.applied_migrations (file, git_sha, sql_sha256) values ('$FILE', '$SHA', '$HASH');
\i $SQL
commit;
SQLEOF
echo "Đã chạy $FILE (sha256 ${HASH:0:12})."
