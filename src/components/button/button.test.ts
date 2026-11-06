import { describe, expect, it, vi } from 'vitest';
import { createButton, updateButton } from './button.js';

describe('createButton', () => {
  it('renders a primary, medium, non-submitting button by default', () => {
    const button = createButton({ label: 'Save' });

    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.textContent).toBe('Save');
    expect(button.classList.contains('nl-button')).toBe(true);
    expect(button.classList.contains('nl-button--primary')).toBe(true);
    expect(button.classList.contains('nl-button--md')).toBe(true);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  it('applies variant, size and type', () => {
    const button = createButton({ label: 'Go', variant: 'ghost', size: 'lg', type: 'submit' });

    expect(button.classList.contains('nl-button--ghost')).toBe(true);
    expect(button.classList.contains('nl-button--primary')).toBe(false);
    expect(button.classList.contains('nl-button--lg')).toBe(true);
    expect(button.type).toBe('submit');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    createButton({ label: 'Tap', onClick }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled or loading', () => {
    const onClick = vi.fn();
    createButton({ label: 'A', disabled: true, onClick }).click();
    createButton({ label: 'B', loading: true, onClick }).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets the label as text, never as HTML', () => {
    const button = createButton({ label: '<img src=x onerror=alert(1)>' });
    expect(button.querySelector('img')).toBeNull();
    expect(button.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('updateButton', () => {
  it('loading disables the button and sets aria-busy; clearing it restores the explicit state', () => {
    const button = createButton({ label: 'Save' });

    updateButton(button, { label: 'Save', loading: true });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    updateButton(button, { label: 'Save', loading: false });
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);

    updateButton(button, { label: 'Save', disabled: true, loading: true });
    updateButton(button, { label: 'Save', disabled: true, loading: false });
    expect(button.disabled).toBe(true);
  });

  it('swaps modifier classes without touching consumer classes or the click listener', () => {
    const onClick = vi.fn();
    const button = createButton({ label: 'X', variant: 'primary', size: 'sm', onClick });
    button.classList.add('my-class');

    updateButton(button, { label: 'Y', variant: 'secondary', size: 'lg' });

    expect(button.classList.contains('my-class')).toBe(true);
    expect(button.classList.contains('nl-button--primary')).toBe(false);
    expect(button.classList.contains('nl-button--sm')).toBe(false);
    expect(button.classList.contains('nl-button--secondary')).toBe(true);
    expect(button.classList.contains('nl-button--lg')).toBe(true);
    expect(button.textContent).toBe('Y');

    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
