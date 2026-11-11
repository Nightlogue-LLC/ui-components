import { createCompactGameHeader } from '../../../src/projects/grim-glimmer/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { el } from '../../lib/dom.js';
import './tarot-header.css';
/** Collection-owned copy; the header factory accepts independent identity fields. */
export const PUZZLE_IDENTITIES = {
  camper: { tarotNumeral: 'I', archetypeTitle: 'The Camper', puzzleName: 'Trees & Tents' },
  arbiter: { tarotNumeral: 'II', archetypeTitle: 'The Arbiter', puzzleName: 'Unequal' },
  architect: { tarotNumeral: 'III', archetypeTitle: 'The Architect', puzzleName: 'Shikaku' },
} as const;
export interface TarotHeaderOptions {
  tarotNumeral: string;
  archetypeTitle: string;
  puzzleName: string;
  difficulty: string;
  columns: number;
  rows: number;
  onHint?: () => void;
  onMenu?: () => void;
  /** Before/after review only: hide the identity without changing the layout slot. */
  showIdentity?: boolean;
}
/** V4 facade over the current shared compact header. No production API changes. */
export function createTarotGameplayHeader(options: TarotHeaderOptions) {
  if (![options.columns, options.rows].every((value) => Number.isInteger(value) && value > 0))
    throw Error('Board dimensions must be positive integers');
  const header = createCompactGameHeader({
    title: options.puzzleName,
    status: `${options.difficulty} · ${options.columns}×${options.rows}`,
    icons: { hint: createIcon('hint'), menu: createIcon('more') },
    onHint: options.onHint,
    onMenu: options.onMenu,
  });
  header.classList.add('gg-v4-tarot-header');
  const identity = el('p', {
    className: 'gg-v4-tarot-identity',
    text: `${options.tarotNumeral} · ${options.archetypeTitle.toUpperCase()}`,
  });
  identity.hidden = options.showIdentity === false;
  header.querySelector('.nl-grim-glimmer-game-header__heading')!.prepend(identity);
  return header;
}
