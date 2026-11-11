import { createCompactGameHeader } from './game-screen.js';
import { createIcon } from '../../components/icon/index.js';

export interface TarotHeaderOptions {
  tarotNumeral: string;
  archetypeTitle: string;
  puzzleName: string;
  difficulty: string;
  columns: number;
  rows: number;
  onHint?: () => void;
  onMenu?: () => void;
  hintLabel?: string;
  showIdentity?: boolean;
}

/** Presentation only; collection identity and real board data belong to the app. */
export function createTarotGameplayHeader(options: TarotHeaderOptions): HTMLElement {
  if (![options.columns, options.rows].every((value) => Number.isInteger(value) && value > 0))
    throw new Error('Board dimensions must be positive integers');
  const header = createCompactGameHeader({
    title: options.puzzleName,
    status: `${options.difficulty} · ${options.columns}×${options.rows}`,
    icons: { hint: createIcon('hint'), menu: createIcon('more') },
    onHint: options.onHint,
    onMenu: options.onMenu,
  });
  header.classList.add('nl-grim-glimmer-v4', 'gg-v4-tarot-header');
  const identity = document.createElement('p');
  identity.className = 'gg-v4-tarot-identity';
  identity.textContent = `${options.tarotNumeral} · ${options.archetypeTitle.toUpperCase()}`;
  identity.hidden = options.showIdentity === false;
  header.querySelector('.nl-grim-glimmer-game-header__heading')!.prepend(identity);
  if (options.hintLabel) {
    const hint = header.querySelector('button')!;
    hint.setAttribute('aria-label', options.hintLabel);
  }
  return header;
}
