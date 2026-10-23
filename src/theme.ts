export type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  try {
    const s = localStorage.getItem('vbqppl-theme');
    if (s === 'light' || s === 'dark') return s;
  } catch { /* ignore */ }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('vbqppl-theme', t); } catch { /* ignore */ }
}
