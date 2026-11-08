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
  git checkout -- src/lib/dal.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts src/lib/ai/client.ts next.config.ts src/lib/content/registry.generated.ts
  rm -rf src/lib/e2e-fake.ts src/app/api/e2e .next/dev
}
trap revert EXIT
run() { # role port script
  E2E_ROLE=$1 setsid npx next dev -p "$2" > "e2e/out/dev-$1.log" 2>&1 & PID=$!
  for _ in $(seq 60); do curl -s -o /dev/null "http://localhost:$2/" && break; sleep 1; done
  BASE="http://localhost:$2" node "$3"; local rc=$?
  kill -- "-$PID" 2>/dev/null; wait "$PID" 2>/dev/null; PID=; sleep 2
  # A flow that crashes (uncaught exception, timeout) prints no FAIL line of its own — say it here.
  if [ "$rc" -ne 0 ]; then echo "FAIL flow $3 exited with code $rc"; FAILED+=("$3"); fi
  return $rc
}
FAILED=()
mkdir -p e2e/out
run parent 3100 e2e/preview-flow.mjs; a=$?
run student 3101 e2e/student-flow.mjs; b=$?
run tutor 3102 e2e/tutor-flow.mjs; c=$?
run tutor 3110 e2e/assign-flow.mjs; k=$?
run student 3111 e2e/assign-student-flow.mjs; l=$?
run parent 3103 e2e/accounts-flow.mjs; d=$?
run parent 3104 e2e/overview-flow.mjs; e=$?
run parent 3114 e2e/report-flow.mjs; o=$?
run tutor 3115 e2e/brief-flow.mjs; p=$?
# S6a: curriculum engine on the fixture content (registry swapped, restored right after)
node scripts/content-index.mjs --fixtures
# S10 review flows need draft KUs: the fixtures have fd-1, fd-2 (real content is all approved since 23/10)
run tutor 3108 e2e/review-flow.mjs; i=$?
run student 3109 e2e/review-student-flow.mjs; j=$?
run student 3105 e2e/curriculum-flow.mjs; f=$?
run parent 3106 e2e/curriculum-parent-flow.mjs; g=$?
run student 3107 e2e/items-flow.mjs; h=$?
run student 3112 e2e/geometry-flow.mjs; m=$?
run parent 3113 e2e/geometry-parent-flow.mjs; n=$?
run student 3116 e2e/drill-flow.mjs; q=$?
run tutor 3117 e2e/drill-tutor-flow.mjs; r=$?
run student 3118 e2e/focus-flow.mjs; s1=$?
run parent 3119 e2e/focus-parent-flow.mjs; s2=$?
run student 3120 e2e/ai-student-flow.mjs; t1=$?
run parent 3121 e2e/ai-eval-flow.mjs; t2=$?
# S9 Thi thử: the fixture score sheet of Đề 57
run tutor 3122 e2e/mock-tutor-flow.mjs; u1=$?
run student 3123 e2e/mock-student-flow.mjs; u2=$?
run parent 3124 e2e/mock-parent-flow.mjs; u3=$?
# Kiểm tra tiến bộ (08/11): fixture KT1 + target board
run tutor 3125 e2e/progress-tutor-flow.mjs; v1=$?
run student 3126 e2e/progress-student-flow.mjs; v2=$?
node scripts/content-index.mjs
# Exit code comes from every run() call, so a new flow cannot be forgotten in the sum.
if [ ${#FAILED[@]} -gt 0 ]; then echo "e2e: ${#FAILED[@]} flow(s) failed: ${FAILED[*]}"; exit 1; fi
echo "e2e: all flows passed"
