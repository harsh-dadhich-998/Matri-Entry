import React, { useEffect, useState } from 'react';
import { ApiError, apiRequest, errorMessage } from '../../services/api';
import {
  clearWorkspace,
  fromDatabase,
  loadWorkspace,
} from '../../services/storage';
import { User } from '../../types';
import { LoginModal } from './LoginModal';
import { ChangePassword } from './ChangePassword';

export function AuthGate({
  children,
}: {
  children: (user: User) => React.ReactNode;
}) {
  const [sessionId, setSessionId] = useState<string | null | undefined>(
    undefined,
  );
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [passwordChange, setPasswordChange] = useState<{
    expiresAt?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setUser(null);
    setError('');
    setPasswordChange(null);
    clearWorkspace();
    const initialize = async () => {
      try {
        const session = await apiRequest<{
          user: { id: string };
          mustChangePassword: boolean;
          passwordExpiresAt?: string;
        }>('/auth/session');
        if (!active) return;
        setSessionId(session.user.id);
        if (session.mustChangePassword) {
          setPasswordChange({ expiresAt: session.passwordExpiresAt });
          return;
        }
        setUser(await loadWorkspace());
      } catch (reason) {
        if (!active) return;
        if (reason instanceof ApiError && reason.status === 401)
          setSessionId(null);
        else {
          setSessionId(null);
          setError(errorMessage(reason));
        }
      }
    };
    void initialize();
    return () => {
      active = false;
      clearWorkspace();
    };
  }, [attempt]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    let checking = false;
    const verifyAccess = async () => {
      if (checking) return;
      checking = true;
      try {
        const session = await apiRequest<{
          user: Record<string, unknown>;
          mustChangePassword: boolean;
          passwordExpiresAt?: string;
        }>('/auth/session');
        if (!active) return;
        if (session.mustChangePassword) {
          setUser(null);
          setPasswordChange({ expiresAt: session.passwordExpiresAt });
          return;
        }
        const latest = fromDatabase<User>(session.user);
        if (
          latest.role !== user.role ||
          latest.status !== user.status ||
          latest.assignedRecords !== user.assignedRecords ||
          latest.expiryDate !== user.expiryDate
        )
          setAttempt((n) => n + 1);
      } catch (reason) {
        if (!active) return;
        setUser(null);
        clearWorkspace();
        setError(
          reason instanceof ApiError && reason.status === 401
            ? 'Your session has ended or access was changed. Please sign in again.'
            : errorMessage(reason),
        );
        setSessionId(null);
      } finally {
        checking = false;
      }
    };
    const interval = window.setInterval(() => {
      void verifyAccess();
    }, 60000);
    window.addEventListener('focus', verifyAccess);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', verifyAccess);
    };
  }, [user]);
  if (sessionId === null && !error)
    return <LoginModal onSignedIn={() => setAttempt((n) => n + 1)} />;
  if (passwordChange)
    return (
      <ChangePassword
        expiresAt={passwordChange.expiresAt}
        onComplete={() => {
          setPasswordChange(null);
          setSessionId(null);
          setError('');
        }}
      />
    );
  if (error)
    return (
      <main className="auth-page min-h-dvh grid place-items-center p-6">
        <section className="bg-white p-8 rounded-3xl max-w-md shadow-xl">
          <h1 className="text-xl font-bold">Unable to open workspace</h1>
          <p role="alert" className="text-slate-600 my-4">
            {error}
          </p>
          <div className="flex gap-4">
            <button
              className="primary-button rounded-xl text-white px-4 py-2"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </button>
            <button
              onClick={async () => {
                await apiRequest('/auth/logout', { method: 'POST' }).catch(
                  () => {},
                );
                setError('');
                setSessionId(null);
              }}
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  if (!user)
    return (
      <main className="auth-page min-h-dvh grid place-items-center">
        <p role="status" className="text-indigo-700">
          Opening your workspace…
        </p>
      </main>
    );
  return <>{children(user)}</>;
}
