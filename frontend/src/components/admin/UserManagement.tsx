import React, { useEffect, useRef, useState } from 'react';
import { Search, UserPlus, Users, X, Pencil } from 'lucide-react';
import { User } from '../../types';
import { updateOperator } from '../../services/storage';
import { apiRequest, errorMessage } from '../../services/api';
import { useToast } from '../common/Toast';
interface Props {
  users: User[];
  onUsersUpdated: () => void;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
}
const empty = {
  name: '',
  email: '',
  username: '',
  mobile: '',
  role: 'operator' as User['role'],
  assignedRecords: 0,
  expiryDate: '',
  status: 'active' as User['status'],
};
export function UserManagement({
  users,
  onUsersUpdated,
  isCreateModalOpen,
  onCloseCreateModal,
}: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { showToast } = useToast();
  const close = () => {
    if (busy) return;
    setOpen(false);
    setEditing(null);
    onCloseCreateModal();
  };
  useEffect(() => {
    if (isCreateModalOpen) {
      setEditing(null);
      setForm({ ...empty });
      setOpen(true);
    }
  }, [isCreateModalOpen]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const accounts = users.filter((u) =>
    `${u.name} ${u.email} ${u.username} ${u.role}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      let emailSent = true;
      const accountRole = editing?.role ?? form.role;
      if (editing)
        await updateOperator({
          ...editing,
          ...form,
          expiryDate: form.expiryDate
            ? new Date(`${form.expiryDate}T23:59:59`).toISOString()
            : '',
        });
      else {
        const data = await apiRequest<{ emailSent: boolean }>(
          '/admin/operators',
          {
            method: 'POST',
            body: {
              ...form,
              expiryDate: form.expiryDate
                ? new Date(form.expiryDate + 'T23:59:59').toISOString()
                : null,
            },
          },
        );
        emailSent = data.emailSent === true;
      }
      const accountLabel =
        accountRole === 'admin' ? 'Administrator' : 'Operator';
      showToast(
        emailSent ? 'success' : 'warning',
        editing ? 'Operator updated' : `${accountLabel} account created`,
        editing
          ? 'The account settings have been saved.'
          : emailSent
            ? `Resend accepted the temporary login email. The ${accountRole} must change the password at first sign-in.`
            : 'Email delivery failed. Manage the account and send fresh login details. Do not create it again.',
      );
      setOpen(false);
      setEditing(null);
      onCloseCreateModal();
      onUsersUpdated();
    } catch (error) {
      showToast('error', 'Unable to save account', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const resetCredentials = async () => {
    if (
      !editing ||
      busy ||
      !confirm(
        'Reset this operator password and email new temporary login details? Existing workspace access will be blocked until the password is changed.',
      )
    )
      return;
    setBusy(true);
    try {
      const data = await apiRequest<{ emailSent: boolean }>(
        `/admin/operators/${encodeURIComponent(editing.id)}/reset-password`,
        { method: 'POST' },
      );
      showToast(
        data.emailSent ? 'success' : 'warning',
        'Password reset',
        data.emailSent
          ? 'Resend accepted the new temporary login email.'
          : 'Email failed. Check Resend configuration, then retry sending fresh credentials.',
      );
    } catch (error) {
      showToast('error', 'Reset failed', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <section className="dashboard-hero rounded-2xl border flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow">People & access</p>
          <h2 className="text-2xl font-semibold">
            A workspace built around your team.
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Create admin and operator accounts, assign work, and manage access.
          </p>
        </div>
        <button
          className="primary-button text-white px-5 py-3 rounded-xl flex gap-2 items-center font-semibold text-sm"
          onClick={() => {
            setEditing(null);
            setForm({ ...empty });
            setOpen(true);
          }}
        >
          <UserPlus className="w-4 h-4" />
          Create account
        </button>
      </section>
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold">
            Team accounts{' '}
            <span className="text-slate-500">({accounts.length})</span>
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              aria-label="Search accounts"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-xl pl-9 pr-3 text-sm"
            />
          </div>
        </div>
        {accounts.length === 0 ? (
          <div className="p-14 text-center">
            <Users className="w-10 h-10 text-indigo-300 mx-auto mb-4" />
            <h3 className="font-semibold">
              {search ? 'No matching accounts' : 'Your team starts here'}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {search
                ? 'Try another name or email.'
                : 'Create an admin or operator account to start.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4">Account</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Progress</th>
                  <th className="px-5 py-4">Access</th>
                  <th className="px-5 py-4">Expires</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((user) => {
                  const expired =
                    user.expiryDate &&
                    new Date(user.expiryDate).getTime() <= Date.now();
                  return (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize">{user.role}</td>
                      <td className="px-5 py-4">
                        {user.role === 'operator'
                          ? `${user.completedRecords} / ${user.assignedRecords}`
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs capitalize ${!expired && user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {expired ? 'Expired' : user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.expiryDate
                          ? new Date(user.expiryDate).toLocaleDateString()
                          : 'No expiry'}
                      </td>
                      <td className="px-5 py-4">
                        {user.role === 'operator' ? (
                          <button
                            className="flex gap-2 items-center text-indigo-700 font-semibold"
                            onClick={() => {
                              setEditing(user);
                              setForm({
                                name: user.name,
                                email: user.email,
                                username: user.username,
                                mobile: user.mobile,
                                role: user.role,
                                assignedRecords: user.assignedRecords,
                                expiryDate: user.expiryDate?.slice(0, 10) || '',
                                status: user.status,
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                            Manage
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="operator-title"
        className="settings-dialog m-auto p-0 w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-white text-slate-800 shadow-2xl"
      >
        <form onSubmit={save}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 id="operator-title" className="text-xl font-semibold">
              {editing ? 'Manage operator' : 'Create account'}
            </h2>
            <button
              type="button"
              disabled={busy}
              aria-label="Close operator form"
              onClick={close}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[65dvh] overflow-y-auto">
            {(['name', 'email', 'username', 'mobile'] as const).map((field) => (
              <label
                key={field}
                className="block text-sm font-medium capitalize"
              >
                {field === 'name' ? 'Full name' : field}
                <input
                  type={
                    field === 'email'
                      ? 'email'
                      : field === 'mobile'
                        ? 'tel'
                        : 'text'
                  }
                  required={field !== 'mobile'}
                  disabled={
                    busy ||
                    (!!editing && (field === 'email' || field === 'username'))
                  }
                  value={form[field]}
                  maxLength={field === 'name' ? 100 : 254}
                  pattern={
                    field === 'username' ? '[a-zA-Z0-9_]{3,40}' : undefined
                  }
                  title={
                    field === 'username'
                      ? '3–40 letters, numbers, or underscores'
                      : undefined
                  }
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="block w-full px-3 mt-2 border border-slate-200 rounded-xl disabled:bg-slate-50"
                />
              </label>
            ))}
            {!editing && (
              <label className="block text-sm font-medium">
                Account role
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as User['role'] })
                  }
                  className="block w-full mt-2 px-3 border border-slate-200 rounded-xl"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            )}
            <div
              className={`grid gap-4 ${form.role === 'operator' ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              {form.role === 'operator' && (
                <label className="text-sm font-medium">
                  Assigned records
                  <input
                    type="number"
                    required
                    min={0}
                    max={10000}
                    value={form.assignedRecords}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assignedRecords: Number(e.target.value),
                      })
                    }
                    className="block w-full mt-2 px-3 border border-slate-200 rounded-xl"
                  />
                </label>
              )}
              <label className="text-sm font-medium">
                Access expires
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                  className="block w-full mt-2 px-3 border border-slate-200 rounded-xl"
                />
              </label>
            </div>
            {editing && (
              <label className="block text-sm font-medium">
                Account access
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as User['status'],
                    })
                  }
                  className="block w-full mt-2 px-3 border border-slate-200 rounded-xl"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
            )}
            {editing && (
              <button
                type="button"
                disabled={busy}
                onClick={resetCredentials}
                className="text-sm font-semibold text-indigo-700 border border-indigo-200 rounded-xl px-4 py-3"
              >
                Reset password and email login details
              </button>
            )}
            <p className="text-xs text-slate-500">
              {editing
                ? 'Suspended accounts cannot access workspace data. Existing records are retained.'
                : `Resend will email the login details. The ${form.role} must choose a new password within 24 hours.`}
            </p>
          </div>
          <div className="p-5 border-t border-slate-100 flex justify-end">
            <button
              disabled={busy}
              className="primary-button text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {busy
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Create and email login'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
