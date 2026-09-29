import { test } from 'node:test';
import assert from 'node:assert/strict';
import { credentialsEmail } from '../server/email.mjs';

test('onboarding email includes the login link and escapes untrusted HTML', () => {
	const email = credentialsEmail({ name: '<script>bad</script>', username: 'operator', email: 'user@example.invalid' }, 'Aa1!&<strong>test', 'https://app.example.invalid');
	assert.ok(email.text.includes('Login email: user@example.invalid'));
	assert.ok(email.text.includes('Sign in: https://app.example.invalid'));
	assert.ok(email.html.includes('href="https://app.example.invalid"'));
	assert.ok(email.text.includes('24 hours'));
	assert.ok(!email.html.includes('<script>'));
	assert.ok(email.html.includes('&lt;script&gt;'));
	assert.ok(email.html.includes('Aa1!&amp;&lt;strong&gt;test'));
});
