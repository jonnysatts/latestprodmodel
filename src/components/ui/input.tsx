import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

// Fixed Input component that correctly handles numbers and focus
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, onValueChange, ...props }, ref) => {
    // Convert 0 to empty string for display only if it's a number type input
    const displayValue = type === "number" && value === 0 ? "" : value;
    
    // Use a local ref if none is provided
    const inputRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref || inputRef;
    
    // Track focus state to prevent cursor issues
    const [focused, setFocused] = React.useState(false);
    
    // Log values for debugging
    React.useEffect(() => {
      console.log("Input value:", value, "Display value:", displayValue);
    }, [value, displayValue]);
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={resolvedRef}
        value={displayValue}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          const newValue = e.target.value;
          
          // Handle number input type specially
          if (type === "number") {
            // Allow empty input (will be treated as 0 in parent component)
            // Don't convert to number here to avoid cursor jumps
            if (newValue === "") {
              console.log("Empty input detected");
              onChange?.(e);
              onValueChange?.(newValue);
              return;
            }
            
            // For numeric inputs, validate and clean the input
            if (!/^-?\d*\.?\d*$/.test(newValue)) {
              // Invalid number format, don't update
              return;
            }
          }
          
          onChange?.(e);
          onValueChange?.(newValue);
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };