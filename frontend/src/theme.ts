import { useEffect, useState } from 'react';

export const THEMES = [
  { id: 'default', label: 'Default' },
  { id: 'glass-dusk', label: 'Glass Dusk' },
  { id: 'midnight-observatory', label: 'Midnight Observatory' },
  { id: 'paper-almanac', label: 'Paper Almanac' },
  { id: 'swiss-grid', label: 'Swiss Grid' },
  { id: 'soft-pastel', label: 'Soft Pastel' },
  { id: 'terminal-readout', label: 'Terminal Readout' },
  { id: 'storm-front', label: 'Storm Front' },
  { id: 'sunrise-gradient', label: 'Sunrise Gradient' },
  { id: 'material-surface', label: 'Material Surface' },
  { id: 'nordic-minimal', label: 'Nordic Minimal' },
  { id: 'tropical-humidity', label: 'Tropical Humidity' },
  { id: 'arctic-frost', label: 'Arctic Frost' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'tide-chart', label: 'Tide Chart' },
  { id: 'greenhouse', label: 'Greenhouse' },
  { id: 'neon-night', label: 'Neon Night' },
  { id: 'monochrome-editorial', label: 'Monochrome Editorial' },
  { id: 'desert-heat', label: 'Desert Heat' },
  { id: 'ambient-minimal-dark', label: 'Ambient Minimal Dark' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'forest', label: 'Forest' },
  { id: 'ocean-deep', label: 'Ocean Deep' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'retro-80s', label: 'Retro 80s' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'weather-starter-theme';
const DEFAULT_THEME: ThemeId = 'default';

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

function readStoredTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// The Sunrise Gradient theme picks its sky by time of day.
function periodForHour(hour: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

export function useTheme(): [ThemeId, (next: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.period = periodForHour(new Date().getHours());
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this session.
    }
  }, [theme]);

  return [theme, setTheme];
}
