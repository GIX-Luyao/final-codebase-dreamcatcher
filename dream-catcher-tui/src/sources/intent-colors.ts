import type { IntentCategory } from './types.js';

/**
 * Maps intent categories to terminal colors for Ink's <Text color={...}>.
 */
export const INTENT_COLORS: Record<IntentCategory, string> = {
  'Conversational Real-time': 'red',
  'Interactive Workflows': 'yellow',
  'Interactive Entertainment': 'cyan',
  'Buffered Consumption': 'blue',
  'Background': 'gray',
};

/**
 * Short labels for intent categories.
 */
export const INTENT_SHORT: Record<IntentCategory, string> = {
  'Conversational Real-time': 'Conv. RT',
  'Interactive Workflows': 'Inter. Work',
  'Interactive Entertainment': 'Inter. Ent',
  'Buffered Consumption': 'Buffered',
  'Background': 'Background',
};
