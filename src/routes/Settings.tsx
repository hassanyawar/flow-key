import { useSettingsStore } from '../stores';

export function Settings() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-text">Settings</h1>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span id="theme-label">Theme</span>
        <div
          role="group"
          aria-labelledby="theme-label"
          className="flex overflow-hidden rounded-sm border border-border"
        >
          {(['light', 'dark'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => {
                setTheme(option);
              }}
              className={[
                'px-3 py-1 capitalize focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                theme === option
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface text-text hover:opacity-80',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
