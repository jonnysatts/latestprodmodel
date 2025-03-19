import * as React from "react";
import { cn } from "../../lib/utils";

export interface SimpleInputProps extends React.HTMLAttributes<HTMLInputElement> {
  type?: string;
}

/**
 * SimpleInput - A reliable and straightforward input component 
 */
const SimpleInput = React.forwardRef<HTMLInputElement, SimpleInputProps>(
  (props, ref) => {
    const { className, type = "text", ...rest } = props;
    
    // Create a local ref
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Combine refs
    const combinedRef = (element: HTMLInputElement | null) => {
      // Update our local ref
      inputRef.current = element;
      
      // Update the forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };
    
    // Apply styles to ensure interactivity
    React.useEffect(() => {
      if (!inputRef.current) return;
      
      // Force pointer events and positioning
      inputRef.current.style.pointerEvents = 'auto';
      inputRef.current.style.position = 'relative';
      inputRef.current.style.zIndex = '100';
      
      // Make parent elements interactive too
      let parent = inputRef.current.parentElement;
      while (parent) {
        parent.style.pointerEvents = 'auto';
        parent = parent.parentElement;
      }
    }, []);
    
    return (
      <input
        type={type}
        ref={combinedRef}
        className={cn(
          "simple-input",
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
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
      />
    );
  }
);

SimpleInput.displayName = "SimpleInput";

export { SimpleInput }; 