function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ],
  );
}

export function credentialsEmail(user, password, appUrl) {
  const text = `Hello ${user.name},\n\nYour MatriEntry administrator created or reset your account.\nUsername: ${user.username}\nLogin email: ${user.email}\nTemporary password: ${password}\nSign in: ${appUrl}\n\nSign in within 24 hours and choose a new password before accessing the workspace. Do not forward this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#231a30"><h1>Welcome to MatriEntry</h1><p>Hello ${escapeHtml(user.name)},</p><p>Your administrator created or reset your account.</p><p><strong>Username:</strong> ${escapeHtml(user.username)}<br><strong>Login email:</strong> ${escapeHtml(user.email)}</p><p><strong>Temporary password:</strong><br><code>${escapeHtml(password)}</code></p><p><a href="${escapeHtml(appUrl)}">Sign in and change password</a></p><p>Sign in within 24 hours. You must choose a new password before accessing the workspace.</p></div>`;
  return { subject: 'Your MatriEntry temporary login details', text, html };
}
