import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordProblem, hashPassword, verifyPassword } from "../src/modules/accounts/password";

test("weak passwords are rejected", () => {
  assert.ok(passwordProblem("short1"));
  assert.ok(passwordProblem("onlyletters"));
  assert.ok(passwordProblem("12345678"));
  assert.equal(passwordProblem("Garden2026"), null);
});

test("passwords are stored as salted hashes", async () => {
  const a = await hashPassword("Garden2026");
  const b = await hashPassword("Garden2026");
  assert.notEqual(a, b);
  assert.ok(await verifyPassword("Garden2026", a));
  assert.ok(!(await verifyPassword("garden2026", a)));
});
