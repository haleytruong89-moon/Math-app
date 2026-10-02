// Validates every content file before it can reach a student (D16).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Module, Unit } from "./schema.ts";
import { texToHtml } from "./tex.ts";

const root = path.resolve(import.meta.dirname, "../../../content");
const read = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));

/** Collect every text field of a unit so TeX is checked everywhere. */
function texts(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) if (!["id", "type", "level", "status", "module", "figure", "approvedOn", "code", "answer"].includes(k)) texts(x, out);
  return out;
}

for (const dir of fs.readdirSync(root)) {
  const mdir = path.join(root, dir);
  if (!fs.statSync(mdir).isDirectory()) continue;

  test(`module ${dir}`, () => {
    const mod = Module.parse(read(path.join(mdir, "module.json")));
    assert.equal(mod.id, dir, "module id must match folder name");
    const files = fs.readdirSync(mdir).filter((f) => f !== "module.json" && f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
    assert.deepEqual([...files].sort(), [...mod.units].sort(), "module.units must list exactly the unit files");

    const orders = new Set<number>();
    for (const uid of mod.units) {
      const parsed = Unit.safeParse(read(path.join(mdir, `${uid}.json`)));
      assert.ok(parsed.success, `${uid}: ${parsed.success ? "" : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      const u = parsed.data;
      assert.equal(u.id, uid);
      assert.equal(u.module, mod.id);
      assert.ok(!orders.has(u.order), `${uid}: order trùng`);
      orders.add(u.order);
      for (const t of texts(u)) {
        assert.doesNotThrow(() => texToHtml(t), `${uid}: TeX lỗi trong "${t}"`);
        assert.equal((t.match(/\$/g) ?? []).length % 2, 0, `${uid}: số dấu $ lẻ trong "${t}"`);
      }
    }
  });
}
