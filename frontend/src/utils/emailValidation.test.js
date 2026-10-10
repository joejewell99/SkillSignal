import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail } from './emailValidation.js';

test('accepts public email formats and domain endings', () => {
  for (const email of ['joejewell99@hotmail.com', 'dev+jobs@example.dev', 'first.last@company.co.uk', 'a@my-company.uk', '123@example.technology']) {
    assert.equal(isValidEmail(email), true, email);
  }
});
test('rejects malformed addresses and excess length', () => {
  for (const email of ['', 'hello', 'joe@hotmail', 'joe@@hotmail.com', '.joe@example.com', 'joe..j@example.com', 'joe.@example.com', 'joe@-host.com', 'joe@host-.com', 'joe@host..com', 'joe j@example.com', 'joe@example.com\n', 'a'.repeat(65) + '@example.com']) {
    assert.equal(isValidEmail(email), false, email);
  }
});
