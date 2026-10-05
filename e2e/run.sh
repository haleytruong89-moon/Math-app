#!/usr/bin/env bash
# Local end-to-end run against an in-memory database (PGlite + the real migrations).
# Temporarily patches auth/DB clients (see e2e/patch), runs the browser flows, then reverts.
# NEVER commit while the patch is applied — CI fails if src/ mentions E2E_ROLE.
set -uo pipefail
cd "$(dirname "$0")/.."
cp e2e/patch/e2e-fake.ts src/lib/e2e-fake.ts
mkdir -p src/app/api/e2e/sql && cp e2e/patch/route.ts src/app/api/e2e/sql/route.ts
python3 e2e/patch/patch.py
revert() {
  [ -n "${PID:-}" ] && kill -- "-$PID" 2>/dev/null
  git checkout -- src/lib/dal.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts next.config.ts
  rm -rf src/lib/e2e-fake.ts src/app/api/e2e .next/dev
}
trap revert EXIT
run() { # role port script
  E2E_ROLE=$1 setsid npx next dev -p "$2" > "e2e/out/dev-$1.log" 2>&1 & PID=$!
  for _ in $(seq 60); do curl -s -o /dev/null "http://localhost:$2/" && break; sleep 1; done
  BASE="http://localhost:$2" node "$3"; local rc=$?
  kill -- "-$PID" 2>/dev/null; wait "$PID" 2>/dev/null; PID=; sleep 2
  return $rc
}
mkdir -p e2e/out
run parent 3100 e2e/preview-flow.mjs; a=$?
run student 3101 e2e/student-flow.mjs; b=$?
run tutor 3102 e2e/tutor-flow.mjs; c=$?
run parent 3103 e2e/accounts-flow.mjs; d=$?
exit $(( a || b || c || d ))
