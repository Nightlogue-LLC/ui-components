import { describe, expect, it, vi } from 'vitest';
import { createIconButton, updateIconButton } from './icon-button.js';

const svgIcon = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  return svg;
};

describe('createIconButton', () => {
  it('renders a ghost button with the label as its accessible name', () => {
    const button = createIconButton({ label: 'Back', icon: svgIcon() });
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Back');
    expect(button.classList.contains('nl-icon-button--ghost')).toBe(true);
    expect(button.textContent).toBe('');
  });

  it('requires a non-blank label', () => {
    expect(() => createIconButton({ label: '', icon: svgIcon() })).toThrow(/label/);
    expect(() => createIconButton({ label: '   ', icon: svgIcon() })).toThrow(/label/);
  });

  it('clones the icon (the original node is untouched) and hides it from assistive tech', () => {
    const icon = svgIcon();
    const button = createIconButton({ label: 'Help', icon });
    const wrapper = button.querySelector('.nl-icon-button__icon');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper?.firstElementChild).not.toBe(icon);
    expect(wrapper?.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(icon.parentNode).toBeNull();
  });

  it('applies the secondary variant', () => {
    const button = createIconButton({ label: 'X', icon: svgIcon(), variant: 'secondary' });
    expect(button.classList.contains('nl-icon-button--secondary')).toBe(true);
    expect(button.classList.contains('nl-icon-button--ghost')).toBe(false);
  });

  it('calls onClick, but never when disabled', () => {
    const onClick = vi.fn();
    createIconButton({ label: 'Go', icon: svgIcon(), onClick }).click();
    expect(onClick).toHaveBeenCalledTimes(1);

    const blocked = vi.fn();
    const disabled = createIconButton({
      label: 'Go',
      icon: svgIcon(),
      disabled: true,
      onClick: blocked,
    });
    disabled.click();
    expect(disabled.disabled).toBe(true);
    expect(blocked).not.toHaveBeenCalled();
  });

  it('sets the label as an attribute value, never as markup', () => {
    const button = createIconButton({ label: '<img src=x onerror=alert(1)>', icon: svgIcon() });
    expect(button.querySelector('img')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('updateIconButton', () => {
  it('updates label, variant and disabled without touching the icon or listener', () => {
    const onClick = vi.fn();
    const button = createIconButton({ label: 'A', icon: svgIcon(), onClick });
    const glyph = button.querySelector('svg');

    updateIconButton(button, { label: 'B', variant: 'secondary', disabled: true });
    expect(button.getAttribute('aria-label')).toBe('B');
    expect(button.classList.contains('nl-icon-button--secondary')).toBe(true);
    expect(button.disabled).toBe(true);

    updateIconButton(button, { label: 'B' });
    expect(button.disabled).toBe(false);
    expect(button.querySelector('svg')).toBe(glyph);
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('rejects a blank label on update too', () => {
    const button = createIconButton({ label: 'A', icon: svgIcon() });
    expect(() => updateIconButton(button, { label: '' })).toThrow(/label/);
  });
});
