import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { apiRequest, errorMessage } from '../../services/api';
export function ChangePassword({
  expiresAt,
  onComplete,
}: {
  expiresAt?: string;
  onComplete: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const expired =
    !expiresAt ||
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= Date.now();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    if (password === current) {
      setError('Choose a password different from the temporary password.');
      return;
    }
    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      setError(
        'Use at least 12 characters, with uppercase and lowercase letters, a number, and a symbol.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: current, newPassword: password },
      });
      setCurrent('');
      setPassword('');
      setConfirm('');
      setFinished(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!finished) {
        await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
      }
    } finally {
      setBusy(false);
      onComplete();
    }
  };
  return (
    <main className="auth-page min-h-dvh grid place-items-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <LockKeyhole className="w-10 h-10 text-indigo-600 mb-5" />
        <p className="eyebrow">Protect your account</p>
        <h1 className="text-2xl font-semibold">
          {finished
            ? 'Your password is ready'
            : expired
              ? 'Temporary password expired'
              : 'Choose your own password'}
        </h1>
        <p className="text-sm text-slate-500 mt-3 mb-6">
          {finished
            ? 'Sign in again with your new password. Your temporary password will no longer work.'
            : expired
              ? 'Ask your administrator to email a new temporary password.'
              : 'Change the temporary password from your administrator before opening your workspace.'}
        </p>
        {!expired && !finished && (
          <form onSubmit={submit} className="space-y-4">
            {[
              {
                id: 'current-password',
                label: 'Temporary password',
                value: current,
                set: setCurrent,
                autocomplete: 'current-password',
              },
              {
                id: 'new-password',
                label: 'New password',
                value: password,
                set: setPassword,
                autocomplete: 'new-password',
              },
              {
                id: 'confirm-password',
                label: 'Confirm new password',
                value: confirm,
                set: setConfirm,
                autocomplete: 'new-password',
              },
            ].map((field) => (
              <label
                key={field.id}
                htmlFor={field.id}
                className="block text-sm font-medium"
              >
                {field.label}
                <input
                  id={field.id}
                  type="password"
                  required
                  disabled={busy}
                  maxLength={128}
                  autoComplete={field.autocomplete}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-3"
                />
              </label>
            ))}
            <p className="text-xs text-slate-500">
              Use 12–128 characters, including uppercase and lowercase letters,
              a number, and a symbol.
            </p>
            <button
              disabled={busy}
              className="primary-button w-full text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {busy ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-700 mt-4">
            {error}
          </p>
        )}
        <button
          onClick={signOut}
          disabled={busy}
          className="mt-5 text-indigo-700 text-sm font-semibold"
        >
          {finished ? 'Continue to sign in' : 'Back to sign in'}
        </button>
      </section>
    </main>
  );
}
