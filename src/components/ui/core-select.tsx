import * as React from "react";
import { cn } from "../../lib/utils";

// Define comprehensive select props interface
export interface CoreSelectProps extends React.HTMLAttributes<HTMLSelectElement> {
  options?: Array<{ value: string; label: string }>;
}

/**
 * CoreSelect - A reliable base select component
 * 
 * This component is intentionally minimal to ensure maximum reliability
 * while still supporting all standard HTML select attributes and React features.
 */
const CoreSelect = React.forwardRef<HTMLSelectElement, CoreSelectProps>(
  (props, ref) => {
    const { className, children, options, ...rest } = props;
    
    // Create a local ref to ensure we can access the select element
    const selectRef = React.useRef<HTMLSelectElement>(null);
    
    // Combine the forwarded ref with our local ref
    const combinedRef = useCombinedRefs(ref, selectRef);
    
    React.useEffect(() => {
      if (selectRef.current) {
        // Force pointer events to ensure the select is interactive
        selectRef.current.style.pointerEvents = "auto";
        
        // Apply styles to make select more visible in the stacking context
        selectRef.current.style.position = "relative";
        selectRef.current.style.zIndex = "1"; 
      }
    }, []);
    
    return (
      <select
        ref={combinedRef}
        className={cn(
          "core-select",
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
    );
  }
);

CoreSelect.displayName = "CoreSelect";

/**
 * Helper to combine multiple refs
 */
function useCombinedRefs<T>(
  ...refs: Array<React.RefObject<T> | ((instance: T | null) => void) | null | undefined>
): (instance: T | null) => void {
  return React.useCallback((element: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      
      if (typeof ref === "function") {
        ref(element);
      } else {
        ref.current = element;
      }
    });
  }, [refs]);
}

export { CoreSelect }; 