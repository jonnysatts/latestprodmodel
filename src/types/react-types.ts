// React-specific type declarations
import React from 'react';

// Event types
export interface ChangeEvent<T = Element> {
  target: EventTarget & T;
  currentTarget: EventTarget & T;
  preventDefault: () => void;
  stopPropagation: () => void;
  nativeEvent: Event;
  type: string;
  bubbles: boolean;
  cancelable: boolean;
}

export interface EventTarget {
  checked?: boolean;
  value: any;
  name?: string;
}

// Commonly used HTML element interfaces for events
export interface HTMLInputElement extends HTMLElement {
  value: string;
  checked: boolean;
  type: string;
  name: string;
  disabled: boolean;
  placeholder: string;
}

export interface HTMLSelectElement extends HTMLElement {
  value: string;
  name: string;
  options: HTMLOptionsCollection;
  selectedIndex: number;
}

export interface HTMLElement {
  id: string;
  className: string;
}

// React Router types
export interface RouteParams {
  [key: string]: string;
}

// Utility function to get route params
export function useParams<T extends RouteParams>(): T {
  // This is just a type definition - the actual implementation comes from react-router-dom
  return {} as T;
}

// Utility function for navigation
export function useNavigate(): (path: string) => void {
  // This is just a type definition - the actual implementation comes from react-router-dom
  return (path: string) => {};
} 