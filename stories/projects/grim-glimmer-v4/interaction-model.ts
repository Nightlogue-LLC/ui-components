import type { BoardCellState } from '../../../src/projects/grim-glimmer/index.js';
import type { Tool } from './controls.js';
export interface SelectionAdapter {
  selectionStart: () => void;
  selectionChanged: () => void;
  selectionEnd: () => void;
}
export interface InteractionConfig {
  size: number;
  cells: readonly BoardCellState[];
  axisLock?: boolean;
  haptics?: boolean;
  adapter?: SelectionAdapter;
  onChange?: () => void;
  onTransaction?: (kind: string) => void;
}
export class InteractionModel {
  cells: BoardCellState[];
  tool: Tool = 'star';
  readonly history: BoardCellState[][] = [];
  private stroke?: {
    before: BoardCellState[];
    visited: Set<number>;
    start: number;
    axis?: 'row' | 'column';
    erase: boolean;
    active: BoardCellState;
    ticking: boolean;
  };
  constructor(readonly config: InteractionConfig) {
    this.cells = [...config.cells];
  }
  get painting() {
    return this.stroke !== undefined;
  }
  begin(index: number) {
    this.cancel();
    if (!this.valid(index) || this.cells[index] === 'fixed') return;
    const active = this.tool === 'star' ? 'placed' : 'excluded';
    if (this.cells[index] !== 'empty' && this.cells[index] !== active) return;
    this.stroke = {
      before: [...this.cells],
      visited: new Set(),
      start: index,
      erase: this.cells[index] === active,
      active,
      ticking: false,
    };
    this.visit(index);
  }
  private valid(index: number) {
    return Number.isInteger(index) && index >= 0 && index < this.cells.length;
  }
  visit(index: number) {
    const stroke = this.stroke;
    if (!stroke || !this.valid(index)) return;
    const size = this.config.size;
    const startRow = Math.floor(stroke.start / size);
    const startCol = stroke.start % size;
    let row = Math.floor(index / size);
    let col = index % size;
    if (this.config.axisLock !== false && index !== stroke.start) {
      stroke.axis ??= Math.abs(col - startCol) >= Math.abs(row - startRow) ? 'row' : 'column';
      if (stroke.axis === 'row') row = startRow;
      else col = startCol;
      index = row * size + col;
    }
    if (stroke.visited.has(index)) return;
    stroke.visited.add(index);
    if (this.cells[index] !== (stroke.erase ? stroke.active : 'empty')) return;
    this.cells[index] = stroke.erase ? 'empty' : stroke.active;
    if (this.config.haptics && this.config.adapter) {
      if (!stroke.ticking) {
        this.config.adapter.selectionStart();
        stroke.ticking = true;
      }
      this.config.adapter.selectionChanged();
    }
    this.config.onChange?.();
  }
  private endTick() {
    if (this.stroke?.ticking) this.config.adapter?.selectionEnd();
  }
  commit() {
    const stroke = this.stroke;
    if (!stroke) return;
    this.endTick();
    this.stroke = undefined;
    if (stroke.before.some((cell, index) => cell !== this.cells[index])) {
      this.history.push(stroke.before);
      this.config.onTransaction?.('stroke');
    }
    this.config.onChange?.();
  }
  cancel() {
    if (!this.stroke) return;
    const before = this.stroke.before;
    this.endTick();
    this.stroke = undefined;
    this.cells = before;
    this.config.onChange?.();
  }
  undo() {
    this.cancel();
    const before = this.history.pop();
    if (!before) return;
    this.cells = before;
    this.config.onTransaction?.('undo');
    this.config.onChange?.();
  }
  restart() {
    this.cancel();
    const next = this.cells.map((cell) => (cell === 'fixed' ? cell : 'empty'));
    if (next.every((cell, index) => cell === this.cells[index])) return;
    this.history.push([...this.cells]);
    this.cells = next;
    this.config.onTransaction?.('restart');
    this.config.onChange?.();
  }
}
export {
  clampView,
  pinchView,
  interpolate,
} from '../../../src/projects/grim-glimmer/board-view.js';
export type { Point, View } from '../../../src/projects/grim-glimmer/board-view.js';
