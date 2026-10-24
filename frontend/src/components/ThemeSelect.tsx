import { THEMES, useTheme, type ThemeId } from '../theme';

export function ThemeSelect() {
  const [theme, setTheme] = useTheme();

  return (
    <label className="flex items-center justify-between gap-2 text-xs text-white/60">
      <span className="uppercase tracking-[0.14em] font-semibold">Theme</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        className="rounded-lg border border-white/10 bg-white/[0.08] px-2 py-1 text-sm text-white"
      >
        {THEMES.map((option) => (
          <option key={option.id} value={option.id} className="bg-slate-800">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
