import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import './index.css';

const FINGER_TOKENS = [
  '--color-finger-l5',
  '--color-finger-l4',
  '--color-finger-l3',
  '--color-finger-l2',
  '--color-finger-r2',
  '--color-finger-r3',
  '--color-finger-r4',
  '--color-finger-r5',
  '--color-finger-thumb',
];

const CORE_TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-accent',
  '--color-accent-fg',
];

function readTokens(theme: 'light' | 'dark'): Record<string, string> {
  document.documentElement.dataset.theme = theme;
  const styles = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  for (const name of [...CORE_TOKENS, ...FINGER_TOKENS]) {
    tokens[name] = styles.getPropertyValue(name).trim();
  }
  return tokens;
}

describe('App shell', () => {
  it('renders the home route inside the app shell', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Flowtype' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});

describe('theme tokens', () => {
  it('defines every core and finger-ramp token for both themes', () => {
    const light = readTokens('light');
    const dark = readTokens('dark');
    for (const name of [...CORE_TOKENS, ...FINGER_TOKENS]) {
      expect(light[name], `light ${name}`).toBeTruthy();
      expect(dark[name], `dark ${name}`).toBeTruthy();
    }
  });

  it('never reuses an identical hex value between light and dark for the same token', () => {
    const light = readTokens('light');
    const dark = readTokens('dark');
    for (const name of [...CORE_TOKENS, ...FINGER_TOKENS]) {
      expect(light[name], name).not.toBe(dark[name]);
    }
  });
});

describe('typography', () => {
  // jsdom doesn't resolve the `font-family` shorthand on a classed element
  // (it reports a placeholder), so assert on the underlying custom
  // properties instead — these are what `font-mono`/`font-sans` resolve to.
  it('gives the typing surface a monospace stack distinct from the chrome sans stack', () => {
    const styles = getComputedStyle(document.documentElement);
    const monoFamily = styles.getPropertyValue('--font-mono').trim();
    const sansFamily = styles.getPropertyValue('--font-sans').trim();

    expect(monoFamily).toBeTruthy();
    expect(sansFamily).toBeTruthy();
    expect(monoFamily.toLowerCase()).toContain('monospace');
    expect(monoFamily).not.toBe(sansFamily);
  });
});
