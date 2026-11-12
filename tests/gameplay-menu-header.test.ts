import { describe, it, expect, vi } from 'vitest';
import {
  createGameplayMenuHeader,
  createGameMenuSheet,
} from '../src/projects/grim-glimmer/index.js';
describe('consolidated gameplay menu header', () => {
  it('uses consumer title/navigation and connects the real menu trigger', () => {
    const onBack = vi.fn();
    const header = createGameplayMenuHeader({ title: 'Trees & Tents', onBack });
    const content = document.createElement('div');
    const action = document.createElement('button');
    action.textContent = 'New Game';
    content.append(action);
    const menu = createGameMenuSheet({
      trigger: header.menuTrigger,
      content,
      history: false,
      presentation: 'popover',
      animations: () => false,
    });
    document.body.append(header.element, menu.element);
    header.backButton.click();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(header.title.textContent).toBe('Trees & Tents');
    expect(header.element.querySelectorAll('button')).toHaveLength(2);
    header.menuTrigger.click();
    expect(header.menuTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.element.hidden).toBe(false);
    menu.destroy();
    header.element.remove();
  });
});
