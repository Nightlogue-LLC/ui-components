import { expect, it } from 'vitest';
import { screen } from '../stories/projects/grim-glimmer-v3/screen-fixtures.js';
it('uses real navigation with labels and accepts a Settings navigation request', () => {
  const home = screen('Home', 'moonlit-oxblood', 'light');
  document.body.append(home);
  const nav = home.querySelector('.nl-bottom-nav')!;
  expect(nav.classList.contains('nl-bottom-nav--icon-only')).toBe(false);
  expect(nav.querySelectorAll('.nl-bottom-nav__icon')).toHaveLength(2);
  expect([...nav.querySelectorAll('.nl-bottom-nav__label')].map((n) => n.textContent)).toEqual([
    'Home',
    'Settings',
  ]);
  expect(nav.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Home');
  nav.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!.click();
  expect(document.body.querySelector('.nl-grim-glimmer-app-settings')).not.toBeNull();
  document.body.replaceChildren();
});
