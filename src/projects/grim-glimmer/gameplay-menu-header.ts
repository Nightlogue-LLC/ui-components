import { createIconButton } from '../../components/icon-button/index.js';
import { createIcon } from '../../components/icon/index.js';

export interface GameplayMenuHeaderOptions {
  title: string;
  backLabel?: string;
  onBack: () => void;
}

/** Consolidated Back/title/menu header from the approved V4 GameMenu story.
 * The consumer connects menuTrigger to createGameMenuSheet and owns navigation.
 */
export function createGameplayMenuHeader(options: GameplayMenuHeaderOptions) {
  const element = document.createElement('header');
  element.className = 'nl-grim-glimmer-v4 gg-v4-gameplay-menu-header';
  const backButton = createIconButton({
    label: options.backLabel ?? 'Return Home',
    icon: createIcon('back'),
    onClick: options.onBack,
  });
  const title = document.createElement('h1');
  title.textContent = options.title;
  const menuTrigger = createIconButton({ label: 'Game menu', icon: createIcon('more') });
  const heading = document.createElement('div');
  heading.className = 'gg-v4-gameplay-heading';
  heading.append(title);
  element.append(backButton, heading, menuTrigger);
  return { element, backButton, menuTrigger, title, heading };
}
