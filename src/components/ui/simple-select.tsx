import * as React from "react";
import { cn } from "../../lib/utils";

export interface SimpleSelectProps extends React.HTMLAttributes<HTMLSelectElement> {
  options?: Array<{ value: string; label: string }>;
}

/**
 * SimpleSelect - A reliable and straightforward select component 
 */
const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  (props, ref) => {
    const { className, children, options, ...rest } = props;
    
    // Create a local ref
    const selectRef = React.useRef<HTMLSelectElement>(null);
    
    // Combine refs
    const combinedRef = (element: HTMLSelectElement | null) => {
      // Update our local ref
      selectRef.current = element;
      
      // Update the forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };
    
    // Apply styles to ensure interactivity
    React.useEffect(() => {
      if (!selectRef.current) return;
      
      // Force pointer events and positioning
      selectRef.current.style.pointerEvents = 'auto';
      selectRef.current.style.position = 'relative';
      selectRef.current.style.zIndex = '100';
      
      // Make parent elements interactive too
      let parent = selectRef.current.parentElement;
      while (parent) {
        parent.style.pointerEvents = 'auto';
        parent = parent.parentElement;
      }
    }, []);
    
    return (
      <select
        ref={combinedRef}
        className={cn(
          "simple-select",
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 100
        }}
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

SimpleSelect.displayName = "SimpleSelect";

export { SimpleSelect }; 