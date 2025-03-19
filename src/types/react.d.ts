import 'react';

declare module 'react' {
  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Extend for custom attributes if needed
  }

  export interface FormEvent<T = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
    currentTarget: EventTarget & T;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: Event;
    timeStamp: number;
    type: string;
  }

  export type FC<P = Record<string, never>> = FunctionComponent<P>;

  export interface FunctionComponent<P = Record<string, never>> {
    (props: P, context?: unknown): ReactElement<unknown, unknown> | null;
    propTypes?: WeakValidationMap<P> | undefined;
    contextTypes?: ValidationMap<unknown> | undefined;
    defaultProps?: Partial<P> | undefined;
    displayName?: string | undefined;
  }

  export type ForwardRefRenderFunction<T, P = Record<string, never>> = (
    props: P,
    ref: React.Ref<T>
  ) => ReactElement<unknown, unknown> | null;

  export interface SVGProps<T> extends SVGAttributes<T>, ClassAttributes<T> {
    // Extend for custom SVG attributes if needed
  }

  export function forwardRef<T, P = unknown>(
    render: ForwardRefRenderFunction<T, P>
  ): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;

  export function memo<P = unknown>(
    Component: FunctionComponent<P>,
    propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
  ): NamedExoticComponent<P>;

  export type ReactNode = 
    | ReactElement<any, any> 
    | string 
    | number 
    | Iterable<ReactNode> 
    | ReactPortal 
    | boolean 
    | null 
    | undefined;

  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type JSXElementConstructor<P> =
    | ((props: P) => ReactElement<any, any> | null)
    | (new (props: P) => Component<any, any>);

  export type Key = string | number;

  export interface ReactPortal {
    key: Key | null;
    children: ReactNode;
  }

  export interface WeakValidationMap<T> {
    [key: string]: WeakValidator<T>;
  }

  export interface ValidationMap<T> {
    [key: string]: Validator<T>;
  }

  export type Validator<T> = (object: T, key: string, componentName: string, ...rest: unknown[]) => Error | null;
  export type WeakValidator<T> = (object: {[key: string]: T}, key: string, componentName: string, ...rest: unknown[]) => Error | null;
} 