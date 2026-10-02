import React, { useState } from 'react';
import {
  Heart,
  ArrowRight,
  User,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiRequest, errorMessage } from '../../services/api';

export function LoginModal({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      setPassword('');
      onSignedIn();
    } catch (error) {
      const message = errorMessage(error);
      setError(
        /invalid login credentials/i.test(message)
          ? 'The username or password is incorrect. Use the login username from your administrator.'
          : message,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page min-h-dvh flex items-center justify-center p-5">
      <div className="auth-card grid lg:grid-cols-2 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <section className="auth-story p-8 sm:p-12 text-white flex flex-col justify-between gap-14">
          <div className="flex items-center gap-3 text-xl font-bold">
            <span className="p-3 rounded-2xl bg-white/15">
              <Heart className="w-6 h-6" />
            </span>
            MatriEntry
          </div>
          <div>
            <p className="text-violet-200 text-xs tracking-[.2em] uppercase mb-5">
              Meaningful connections start here
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              A thoughtful space.
              <br />
              For every profile.
            </h1>
            <p className="text-violet-100 mt-5 leading-relaxed max-w-sm">
              Your people, profiles, and progress. Beautifully organized in one
              workspace.
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-violet-200">
            <ShieldCheck className="w-4 h-4" />
            Access for your team
          </p>
        </section>
        <section className="p-8 sm:p-12 flex flex-col justify-center">
          <p className="eyebrow">Welcome to MatriEntry</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Sign in to your workspace
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mt-3 mb-8">
            Enter your username and password to continue.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-semibold mb-2"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-12 py-3"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 p-1 text-slate-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="primary-button w-full flex justify-center items-center gap-2 px-5 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              {busy ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-7 leading-relaxed">
            New account or forgotten password? Ask your administrator to provide
            or reset your login details. Sign in with the username provided by
            your administrator.
          </p>
        </section>
      </div>
    </main>
  );
}
