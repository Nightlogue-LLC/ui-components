import i0light from '@phosphor-icons/core/assets/light/arrow-left-light.svg?raw';
import i0fill from '@phosphor-icons/core/assets/fill/arrow-left-fill.svg?raw';
import i1light from '@phosphor-icons/core/assets/light/dots-three-vertical-light.svg?raw';
import i1fill from '@phosphor-icons/core/assets/fill/dots-three-vertical-fill.svg?raw';
import i2light from '@phosphor-icons/core/assets/light/x-light.svg?raw';
import i2fill from '@phosphor-icons/core/assets/fill/x-fill.svg?raw';
import i3light from '@phosphor-icons/core/assets/light/gear-light.svg?raw';
import i3fill from '@phosphor-icons/core/assets/fill/gear-fill.svg?raw';
import i4light from '@phosphor-icons/core/assets/light/house-light.svg?raw';
import i4fill from '@phosphor-icons/core/assets/fill/house-fill.svg?raw';
import i5light from '@phosphor-icons/core/assets/light/chart-bar-light.svg?raw';
import i5fill from '@phosphor-icons/core/assets/fill/chart-bar-fill.svg?raw';
import i6light from '@phosphor-icons/core/assets/light/lightbulb-light.svg?raw';
import i6fill from '@phosphor-icons/core/assets/fill/lightbulb-fill.svg?raw';
import i7light from '@phosphor-icons/core/assets/light/arrow-counter-clockwise-light.svg?raw';
import i7fill from '@phosphor-icons/core/assets/fill/arrow-counter-clockwise-fill.svg?raw';
import i8light from '@phosphor-icons/core/assets/light/arrow-u-up-left-light.svg?raw';
import i8fill from '@phosphor-icons/core/assets/fill/arrow-u-up-left-fill.svg?raw';
import i9light from '@phosphor-icons/core/assets/light/arrow-u-up-right-light.svg?raw';
import i9fill from '@phosphor-icons/core/assets/fill/arrow-u-up-right-fill.svg?raw';
import i10light from '@phosphor-icons/core/assets/light/speaker-high-light.svg?raw';
import i10fill from '@phosphor-icons/core/assets/fill/speaker-high-fill.svg?raw';
import i11light from '@phosphor-icons/core/assets/light/speaker-slash-light.svg?raw';
import i11fill from '@phosphor-icons/core/assets/fill/speaker-slash-fill.svg?raw';
import i12light from '@phosphor-icons/core/assets/light/music-note-light.svg?raw';
import i12fill from '@phosphor-icons/core/assets/fill/music-note-fill.svg?raw';
import i13light from '@phosphor-icons/core/assets/light/vibrate-light.svg?raw';
import i13fill from '@phosphor-icons/core/assets/fill/vibrate-fill.svg?raw';
import i14light from '@phosphor-icons/core/assets/light/trash-light.svg?raw';
import i14fill from '@phosphor-icons/core/assets/fill/trash-fill.svg?raw';
import i15light from '@phosphor-icons/core/assets/light/trophy-light.svg?raw';
import i15fill from '@phosphor-icons/core/assets/fill/trophy-fill.svg?raw';
import i16light from '@phosphor-icons/core/assets/light/list-light.svg?raw';
import i16fill from '@phosphor-icons/core/assets/fill/list-fill.svg?raw';
import i17light from '@phosphor-icons/core/assets/light/play-light.svg?raw';
import i17fill from '@phosphor-icons/core/assets/fill/play-fill.svg?raw';
import i18light from '@phosphor-icons/core/assets/light/check-light.svg?raw';
import i18fill from '@phosphor-icons/core/assets/fill/check-fill.svg?raw';
import i19light from '@phosphor-icons/core/assets/light/caret-down-light.svg?raw';
import i19fill from '@phosphor-icons/core/assets/fill/caret-down-fill.svg?raw';
import i20light from '@phosphor-icons/core/assets/light/question-light.svg?raw';
import i20fill from '@phosphor-icons/core/assets/fill/question-fill.svg?raw';

/** The only Phosphor imports in the library. Explicit assets keep the catalog out of bundles. */
export const ICON_MAP = {
  back: { name: 'arrow-left', light: i0light, fill: i0fill },
  more: { name: 'dots-three-vertical', light: i1light, fill: i1fill },
  close: { name: 'x', light: i2light, fill: i2fill },
  settings: { name: 'gear', light: i3light, fill: i3fill },
  home: { name: 'house', light: i4light, fill: i4fill },
  stats: { name: 'chart-bar', light: i5light, fill: i5fill },
  hint: { name: 'lightbulb', light: i6light, fill: i6fill },
  restart: { name: 'arrow-counter-clockwise', light: i7light, fill: i7fill },
  exclude: { name: 'x', light: i2light, fill: i2fill },
  undo: { name: 'arrow-u-up-left', light: i8light, fill: i8fill },
  redo: { name: 'arrow-u-up-right', light: i9light, fill: i9fill },
  sound: { name: 'speaker-high', light: i10light, fill: i10fill },
  soundOff: { name: 'speaker-slash', light: i11light, fill: i11fill },
  music: { name: 'music-note', light: i12light, fill: i12fill },
  haptics: { name: 'vibrate', light: i13light, fill: i13fill },
  clear: { name: 'trash', light: i14light, fill: i14fill },
  achievements: { name: 'trophy', light: i15light, fill: i15fill },
  list: { name: 'list', light: i16light, fill: i16fill },
  play: { name: 'play', light: i17light, fill: i17fill },
  check: { name: 'check', light: i18light, fill: i18fill },
  chevronDown: { name: 'caret-down', light: i19light, fill: i19fill },
  help: { name: 'question', light: i20light, fill: i20fill },
} as const;
export type IconName = keyof typeof ICON_MAP | 'menu';
export const ICON_NAMES = Object.keys(ICON_MAP) as (keyof typeof ICON_MAP)[];
