import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPassword } from './passwordStrength.js';

test('rejects short, common, repetitive and keyboard passwords', () => {
  for (const password of ['', 'X9!vR2#', 'password', 'Password123456789!', 'aaaaaaaaaaaaaaaaaaaa', '12345678']) {
    assert.equal(assessPassword(password).acceptable, false);
  }
});
test('allows eight characters and advisory weak ratings without warning', () => {
  for (const password of ['LOLIPOP36', 'X9!vR2#k']) {
    assert.equal(assessPassword(password).acceptable, true);
    assert.equal(assessPassword(password).guidance, '');
  }
  assert.equal(assessPassword('').guidance, '');
  assert.equal(assessPassword('pass').guidance, '');
  assert.ok(assessPassword('password').guidance);
});
test('accepts long unrelated words without composition rules', () => {
  assert.equal(assessPassword('cobalt otter lantern meadow').acceptable, true);
});
test('takes the account name into consideration', () => {
  assert.equal(assessPassword('VeryUniqueCompany2026!', 'VeryUniqueCompany').acceptable, false);
});
test('enforces the UTF-8 byte limit', () => {
  assert.equal(assessPassword('界'.repeat(25)).acceptable, false);
});
