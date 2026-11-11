export {
  createTarotGameplayHeader,
  type TarotHeaderOptions,
} from '../../../src/projects/grim-glimmer/index.js';
import './tarot-header.css';
/** Collection-owned copy; the header factory accepts independent identity fields. */
export const PUZZLE_IDENTITIES = {
  camper: { tarotNumeral: 'I', archetypeTitle: 'The Camper', puzzleName: 'Trees & Tents' },
  arbiter: { tarotNumeral: 'II', archetypeTitle: 'The Arbiter', puzzleName: 'Unequal' },
  architect: { tarotNumeral: 'III', archetypeTitle: 'The Architect', puzzleName: 'Shikaku' },
} as const;
