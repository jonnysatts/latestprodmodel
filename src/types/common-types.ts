/**
 * Common TypeScript types to replace 'any' types throughout the codebase
 */

// Generic record type to use instead of 'any' for objects with string keys
export type GenericRecord = Record<string, unknown>;

// Typed version of event handlers
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;

// Generic handlers
export type ChangeHandler<T> = (value: T) => void;
export type EventHandler<E> = (event: E) => void;

// Value types for different inputs
export type InputValue = string | number | boolean;

// Function types
export type AsyncCallback<T = void> = (...args: unknown[]) => Promise<T>;
export type SyncCallback<T = void> = (...args: unknown[]) => T;

// Common state types
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

// DataItem for tables, charts, etc.
export interface DataItem {
  id: string;
  [key: string]: unknown;
}

// Response types
export interface ApiResponse<T> {
  data?: T;
  error?: Error;
  status: number;
  success: boolean;
}

// Component props with common patterns
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  [key: string]: unknown;
}

// Common handler types
export type HandleInputChange = (event: InputChangeEvent) => void;
export type HandleSelectChange = (event: SelectChangeEvent) => void;
export type HandleValueChange<T = InputValue> = (value: T) => void; 