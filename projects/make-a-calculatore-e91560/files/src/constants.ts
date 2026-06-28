import type { ButtonConfig } from './types';

export const MAX_DIGITS = 15;
export const DISPLAY_MAX_LENGTH = 12;

export const BUTTONS: ButtonConfig[][] = [
  [
    { label: 'C', value: 'clear', type: 'clear' },
    { label: '±', value: 'negate', type: 'function' },
    { label: '%', value: 'percent', type: 'function' },
    { label: '÷', value: '÷', type: 'operator' },
  ],
  [
    { label: '7', value: '7', type: 'digit' },
    { label: '8', value: '8', type: 'digit' },
    { label: '9', value: '9', type: 'digit' },
    { label: '×', value: '×', type: 'operator' },
  ],
  [
    { label: '4', value: '4', type: 'digit' },
    { label: '5', value: '5', type: 'digit' },
    { label: '6', value: '6', type: 'digit' },
    { label: '-', value: '-', type: 'operator' },
  ],
  [
    { label: '1', value: '1', type: 'digit' },
    { label: '2', value: '2', type: 'digit' },
    { label: '3', value: '3', type: 'digit' },
    { label: '+', value: '+', type: 'operator' },
  ],
  [
    { label: '0', value: '0', type: 'digit', span: 2 },
    { label: '.', value: '.', type: 'digit' },
    { label: '=', value: '=', type: 'equals' },
  ],
];

export const KEY_MAPPINGS: Record<string, string> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '.': '.',
  '+': '+',
  '-': '-',
  '*': '×',
  '/': '÷',
  Enter: '=',
  '=': '=',
  Escape: 'clear',
  Backspace: 'backspace',
  Delete: 'clear',
  '%': 'percent',
};
