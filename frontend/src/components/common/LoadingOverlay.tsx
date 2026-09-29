import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeApiLoading } from '../../services/api';

export function LoadingOverlay() {
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeApiLoading(setBusy), []);

  if (!busy) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-sm font-semibold text-slate-800">
          Please wait…
        </span>
      </div>
    </div>
  );
}
