import type { WordPack } from './types';

export type { WordPack, WordPackHeader } from './types';

const packModules = import.meta.glob<{ default: WordPack }>('./packs/*.json', { eager: true });

/** Every shipped pack, auto-discovered from src/content/packs/ — adding a
 * new pack file picks it up here with no other wiring needed. */
export const ALL_PACKS: readonly WordPack[] = Object.values(packModules).map((m) => m.default);

function getPack(filename: string): WordPack {
  const mod = packModules[`./packs/${filename}`];
  if (!mod) throw new Error(`content pack not found: ${filename}`);
  return mod.default;
}

export const common1k = getPack('common-1k.json');
export const common5k = getPack('common-5k.json');
export const homeRow = getPack('home-row.json');
