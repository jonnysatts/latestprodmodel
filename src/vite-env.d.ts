/// <reference types="vite/client" />

/**
 * Global augmentation for React to ensure consistent import patterns across the application.
 * This allows us to use 'import * as React from "react"' pattern consistently.
 */
import * as ReactOriginal from "react";

declare global {
  namespace React {
    // Basic React types
    export type FC<P = Record<string, never>> = ReactOriginal.FC<P>;
    export type ReactNode = ReactOriginal.ReactNode;
    export type CSSProperties = ReactOriginal.CSSProperties;
    export type ReactElement = ReactOriginal.ReactElement;
    export type Element = ReactOriginal.ReactElement;
    export type ElementType = ReactOriginal.ElementType;
    export type ElementRef<T> = ReactOriginal.ElementRef<T>;
    export type Key = ReactOriginal.Key;
    export type RefObject<T> = ReactOriginal.RefObject<T>;
    
    // Event types
    export type FormEvent<T = Element> = ReactOriginal.FormEvent<T>;
    export type ChangeEvent<T = Element> = ReactOriginal.ChangeEvent<T>;
    export type MouseEvent<T = Element> = ReactOriginal.MouseEvent<T>;
    export type KeyboardEvent<T = Element> = ReactOriginal.KeyboardEvent<T>;
    export type FocusEvent<T = Element> = ReactOriginal.FocusEvent<T>;

    // Props types
    export type ComponentProps<T extends ElementType> = ReactOriginal.ComponentProps<T>;
    export type ComponentPropsWithRef<T extends ElementType> = ReactOriginal.ComponentPropsWithRef<T>;
    export type ComponentPropsWithoutRef<T extends ElementType> = ReactOriginal.ComponentPropsWithoutRef<T>;
    export type PropsWithChildren<P = Record<string, never>> = ReactOriginal.PropsWithChildren<P>;
    
    // HTML Element Attributes
    export type HTMLAttributes<T = Element> = ReactOriginal.HTMLAttributes<T>;
    export type ButtonHTMLAttributes<T = HTMLButtonElement> = ReactOriginal.ButtonHTMLAttributes<T>;
    export type InputHTMLAttributes<T = HTMLInputElement> = ReactOriginal.InputHTMLAttributes<T>;
    export type TextareaHTMLAttributes<T = HTMLTextAreaElement> = ReactOriginal.TextareaHTMLAttributes<T>;
    export type SelectHTMLAttributes<T = HTMLSelectElement> = ReactOriginal.SelectHTMLAttributes<T>;
  }
}

declare module 'react' {
  // React hooks
  export const useState: typeof ReactOriginal.useState;
  export const useEffect: typeof ReactOriginal.useEffect;
  export const useContext: typeof ReactOriginal.useContext;
  export const useReducer: typeof ReactOriginal.useReducer;
  export const useCallback: typeof ReactOriginal.useCallback;
  export const useMemo: typeof ReactOriginal.useMemo;
  export const useRef: typeof ReactOriginal.useRef;
  export const useImperativeHandle: typeof ReactOriginal.useImperativeHandle;
  export const useLayoutEffect: typeof ReactOriginal.useLayoutEffect;
  export const useDebugValue: typeof ReactOriginal.useDebugValue;
  export const useId: typeof ReactOriginal.useId;

  // Component creation functions
  export const forwardRef: typeof ReactOriginal.forwardRef;
  export const memo: typeof ReactOriginal.memo;
  export const createContext: typeof ReactOriginal.createContext;
}

// Replace {} with more specific types
declare module '*.svg' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?react' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// Replace {} with Record<string, unknown>
interface ImportMeta {
  readonly env: Record<string, unknown>;
}

// Replace {} with more appropriate types for specific modules
declare module 'lucide-react' {
  // No need to use {} type here
  export const Component: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  // Add other components as needed
}
