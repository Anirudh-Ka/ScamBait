import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULTS = { textScale: 1, contrast: 'normal', motion: 'full', readAloud: false };
const KEY = 'scambait.settings';

const SettingsContext = createContext({ settings: DEFAULTS, update: () => {} });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--text-scale', String(settings.textScale));
    root.dataset.contrast = settings.contrast;
    root.dataset.motion = settings.motion === 'reduce' ? 'reduce' : 'full';
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* storage can be unavailable; settings still work for this visit */
    }
  }, [settings]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
