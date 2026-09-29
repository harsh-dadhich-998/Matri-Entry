import { useEffect, useRef, useState } from 'react';
import { Palette, X, LayoutTemplate, Check, RotateCcw } from 'lucide-react';
import {
  Appearance,
  defaultAppearance,
  readAppearance,
  saveAppearance,
} from '../../services/appearance';
import { useToast } from '../common/Toast';

export function DatabaseSettingsModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState<Appearance>(() => readAppearance(userId));
  const { showToast } = useToast();
  useEffect(() => {
    if (isOpen) {
      setValue(readAppearance(userId));
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [isOpen, userId]);
  const save = () => {
    try {
      saveAppearance(userId, value);
      showToast(
        'success',
        'Appearance saved',
        'Your preferences have been saved for this browser.',
      );
      onClose();
    } catch {
      showToast(
        'error',
        'Unable to save',
        'Browser storage is unavailable. Please try again.',
      );
    }
  };
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="settings-title"
      className="settings-dialog m-auto p-0 w-[calc(100%-2rem)] max-w-2xl rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl"
    >
      <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Make yourself at home</p>
          <h2 id="settings-title" className="text-2xl font-semibold">
            Workspace settings
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Personalize the way you work. Saved for your account in this
            browser.
          </p>
        </div>
        <button
          aria-label="Close settings"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 sm:p-8 space-y-7 max-h-[60dvh] overflow-y-auto">
        <fieldset>
          <legend className="font-semibold flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-indigo-600" />
            Color palette
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(['violet', 'plum'] as const).map((palette) => (
              <label
                key={palette}
                className={`rounded-2xl border-2 p-3 cursor-pointer ${value.palette === palette ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
              >
                <span
                  className={`block h-20 rounded-xl mb-3 ${palette === 'violet' ? 'bg-gradient-to-br from-violet-600 to-purple-900' : 'bg-gradient-to-br from-fuchsia-700 to-violet-900'}`}
                />
                <span className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="radio"
                    name="palette"
                    value={palette}
                    checked={value.palette === palette}
                    onChange={() => setValue({ ...value, palette })}
                  />
                  {palette === 'violet' ? 'Violet dusk' : 'Purple bloom'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold flex items-center gap-2 mb-3">
            <LayoutTemplate className="w-4 h-4 text-indigo-600" />
            Layout
          </legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              Content width
              <select
                value={value.width}
                onChange={(e) =>
                  setValue({
                    ...value,
                    width: e.target.value as Appearance['width'],
                  })
                }
                className="block w-full mt-2 border border-slate-200 rounded-xl px-3 bg-white"
              >
                <option value="focused">Focused — centered workspace</option>
                <option value="wide">Wide — use available space</option>
              </select>
            </label>
            <label className="text-sm">
              Table spacing
              <select
                value={value.density}
                onChange={(e) =>
                  setValue({
                    ...value,
                    density: e.target.value as Appearance['density'],
                  })
                }
                className="block w-full mt-2 border border-slate-200 rounded-xl px-3 bg-white"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
          </div>
        </fieldset>
        <label className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-4 cursor-pointer">
          <span>
            <span className="block font-semibold text-sm">
              Interface animations
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              System reduced-motion preferences are always respected.
            </span>
          </span>
          <input
            type="checkbox"
            checked={value.motion}
            onChange={(e) => setValue({ ...value, motion: e.target.checked })}
            className="w-5"
          />
        </label>
      </div>
      <div className="p-5 sm:px-8 border-t border-slate-100 flex flex-wrap justify-between gap-3">
        <button
          onClick={() => setValue({ ...defaultAppearance })}
          className="text-sm text-slate-600 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restore defaults
        </button>
        <button
          onClick={save}
          className="primary-button text-white rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save preferences
        </button>
      </div>
    </dialog>
  );
}
