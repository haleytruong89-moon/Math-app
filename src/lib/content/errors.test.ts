import { test } from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES, errorLabel } from "./errors.ts";

test("15 error codes E01–E15 with English (canonical) and Vietnamese names", () => {
  assert.equal(ERROR_CODES.length, 15);
  assert.deepEqual(ERROR_CODES.map((e) => e.code), Array.from({ length: 15 }, (_, i) => `E${String(i + 1).padStart(2, "0")}`));
  assert.equal(ERROR_CODES[3].en, "Concept Gap");
});

test("labels: Vietnamese for the student, English on request, bare code if unknown, null if none", () => {
  assert.equal(errorLabel("E10"), "E10 — Sơ ý");
  assert.equal(errorLabel("E10", "en"), "E10 — Careless Error");
  assert.equal(errorLabel("E99"), "E99");
  assert.equal(errorLabel(null), null);
  assert.equal(errorLabel(""), null);
});
