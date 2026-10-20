// H2: lock the grading key of every approved item (see src/lib/content/lock.ts).
//   npm run content:lock                       → add the items of newly approved units / new items
//   npm run content:lock -- --relock <itemId>  → accept a deliberate option wording fix (or a removed item)
// Never use --relock to change the right answer or the order of options of an item students have answered:
// add a new item (new id) instead and remove the old one.
import fs from "node:fs";
import path from "node:path";
import { updateLock, checkLock, type Lock } from "../src/lib/content/lock.ts";

const repo = path.resolve(import.meta.dirname, "..");
const root = path.join(repo, "content");
export const LOCK_FILE = path.join(root, "approved.lock.json");

export function readUnits() {
  const units = [];
  for (const dir of fs.readdirSync(root).sort()) {
    const mdir = path.join(root, dir);
    if (!fs.statSync(mdir).isDirectory()) continue;
    for (const f of fs.readdirSync(mdir).sort())
      if (f.endsWith(".json") && f !== "module.json") units.push(JSON.parse(fs.readFileSync(path.join(mdir, f), "utf8")));
  }
  return units;
}

const relock = new Set<string>();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) if (args[i] === "--relock" && args[i + 1]) relock.add(args[++i]);

const lock: Lock = fs.existsSync(LOCK_FILE) ? JSON.parse(fs.readFileSync(LOCK_FILE, "utf8")) : { units: {} };
const units = readUnits();
const next = updateLock(units, lock, relock);
fs.writeFileSync(LOCK_FILE, JSON.stringify(next, null, 2) + "\n");
const left = checkLock(units, next);
const count = Object.values(next.units).reduce((n, u) => n + Object.keys(u).length, 0);
console.log(`content/approved.lock.json: ${Object.keys(next.units).length} units, ${count} items locked.`);
for (const p of left) console.log(`STILL ${p.kind.toUpperCase()}: ${p.itemId} (${p.unitId}) — đổi đáp án/phương án của câu đã duyệt: tạo câu mới (id mới), hoặc --relock ${p.itemId} nếu chỉ sửa chữ.`);
process.exit(left.length ? 1 : 0);
