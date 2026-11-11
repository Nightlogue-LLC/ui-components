import {
  createBottomSheet,
  destroyBottomSheet,
} from '../../../src/components/bottom-sheet/index.js';
import { type DialogOptions } from '../../../src/components/dialog/index.js';
import { createSwitch as createSharedSwitch } from '../../../src/components/switch/index.js';
import './overlays.css';
export const createSwitch = (label: string, checked: boolean, change: (checked: boolean) => void) =>
  createSharedSwitch({ label, checked, onChange: change });
export interface SheetProposal {
  dialog: HTMLDialogElement;
  destroy: () => void;
}
export function createProposalSheet(options: DialogOptions): SheetProposal {
  const dialog = createBottomSheet({ ...options, presentation: 'editorial' });
  dialog.classList.add('gg-v4-proposal-sheet');
  return { dialog, destroy: () => destroyBottomSheet(dialog) };
}
class OverlayHost extends HTMLElement {
  cleanup?: () => void;
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-overlay-host'))
  customElements.define('gg-v4-overlay-host', OverlayHost);
export function overlayHost() {
  const root = document.createElement('gg-v4-overlay-host') as OverlayHost;
  root.className = 'gg-v4-overlay-stage gg-v4-scope';
  return root;
}
