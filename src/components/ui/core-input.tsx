import * as React from "react";
import { cn } from "../../lib/utils";

// Define comprehensive input props interface
export interface CoreInputProps extends React.HTMLAttributes<HTMLInputElement> {
  type?: string;
}

/**
 * CoreInput - A reliable base input component
 * 
 * This component is intentionally minimal to ensure maximum reliability
 * while still supporting all standard HTML input attributes and React features.
 */
const CoreInput = React.forwardRef<HTMLInputElement, CoreInputProps>(
  (props, forwardedRef) => {
    const { className, type = "text", ...rest } = props;
    
    // Create a local ref to ensure we can access the input element
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Combine the forwarded ref with our local ref
    const combinedRef = useCombinedRefs(forwardedRef, inputRef);
    
    React.useEffect(() => {
      if (inputRef.current) {
        // Force pointer events to ensure the input is interactive
        inputRef.current.style.pointerEvents = "auto";
        
        // Apply styles to make input more visible in the stacking context
        inputRef.current.style.position = "relative";
        inputRef.current.style.zIndex = "1"; 
      }
    }, []);
    
    return (
      <input
        type={type}
        ref={combinedRef}
        className={cn(
          "core-input",
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      />
    );
  }
);

CoreInput.displayName = "CoreInput";

/**
 * Helper to combine multiple refs
 */
function useCombinedRefs<T>(
  forwardedRef: React.ForwardedRef<T> | null | undefined,
  localRef: React.RefObject<T> | null | undefined
): React.RefCallback<T> {
  return React.useCallback((element: T | null) => {
    if (localRef) {
      // TypeScript doesn't know that localRef is a MutableRefObject here
      if (localRef && 'current' in localRef) {
        localRef.current = element;
      }
    }
    
    if (forwardedRef) {
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef && 'current' in forwardedRef) {
        forwardedRef.current = element;
      }
    }
  }, [forwardedRef, localRef]);
}

export { CoreInput }; 