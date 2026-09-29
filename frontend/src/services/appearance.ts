import { useEffect } from 'react';
export interface Appearance {
  palette: 'violet' | 'plum';
  width: 'focused' | 'wide';
  density: 'comfortable' | 'compact';
  motion: boolean;
}
export const defaultAppearance: Appearance = {
  palette: 'violet',
  width: 'focused',
  density: 'comfortable',
  motion: true,
};
const key = (id: string) => `matrientry_appearance_${id}`;
export function readAppearance(id: string): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(key(id)) || '{}');
    return {
      palette: value.palette === 'plum' ? 'plum' : 'violet',
      width: value.width === 'wide' ? 'wide' : 'focused',
      density: value.density === 'compact' ? 'compact' : 'comfortable',
      motion: value.motion !== false,
    };
  } catch {
    return { ...defaultAppearance };
  }
}
export function saveAppearance(id: string, value: Appearance) {
  localStorage.setItem(key(id), JSON.stringify(value));
  window.dispatchEvent(new Event('appearance-change'));
}
export function useAppearance(id: string) {
  useEffect(() => {
    const apply = () => {
      const value = readAppearance(id);
      Object.assign(document.documentElement.dataset, {
        palette: value.palette,
        width: value.width,
        density: value.density,
        motion: String(value.motion),
      });
    };
    apply();
    window.addEventListener('appearance-change', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('appearance-change', apply);
      window.removeEventListener('storage', apply);
      for (const attr of ['palette', 'width', 'density', 'motion'])
        delete document.documentElement.dataset[attr];
    };
  }, [id]);
}
