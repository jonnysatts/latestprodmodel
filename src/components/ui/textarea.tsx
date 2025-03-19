import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void;
}

// Fixed Textarea component with better value handling
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, onValueChange, ...props }, ref) => {
    // Use a local ref if none is provided
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = ref || textareaRef;
    
    // Display empty string for 0 values
    const displayValue = value === 0 ? "" : value;
    
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={resolvedRef}
        value={displayValue}
        onChange={(e) => {
          // Call parent handlers
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };