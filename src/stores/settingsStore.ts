import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'flowtype:theme';

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * The inline boot script in index.html already resolved and applied the
 * initial theme (stored preference, else system preference) before React
 * mounted, to avoid a flash of the wrong theme. Read that back rather than
 * recomputing it, so there is one source of truth for the initial-theme rule.
 */
function getInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
}));
