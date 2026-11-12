import {
  createMonthCard as supported,
  type MonthCardOptions,
} from '../../../src/projects/grim-glimmer/month-card.js';
export type { MonthCardOptions };
export const createMonthCard = (options: MonthCardOptions) =>
  supported({ ...options, previewReplay: true });
import './monthly.css';
