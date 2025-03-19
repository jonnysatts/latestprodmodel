import * as React from "react";
import { cn } from "../../lib/utils";

export interface SimpleTextareaProps extends React.HTMLAttributes<HTMLTextAreaElement> {}

/**
 * SimpleTextarea - A reliable and straightforward textarea component 
 */
const SimpleTextarea = React.forwardRef<HTMLTextAreaElement, SimpleTextareaProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    
    // Create a local ref
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Combine refs
    const combinedRef = (element: HTMLTextAreaElement | null) => {
      // Update our local ref
      textareaRef.current = element;
      
      // Update the forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };
    
    // Apply styles to ensure interactivity
    React.useEffect(() => {
      if (!textareaRef.current) return;
      
      // Force pointer events and positioning
      textareaRef.current.style.pointerEvents = 'auto';
      textareaRef.current.style.position = 'relative';
      textareaRef.current.style.zIndex = '100';
      
      // Make parent elements interactive too
      let parent = textareaRef.current.parentElement;
      while (parent) {
        parent.style.pointerEvents = 'auto';
        parent = parent.parentElement;
      }
    }, []);
    
    return (
      <textarea
        ref={combinedRef}
        className={cn(
          "simple-textarea",
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
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

SimpleTextarea.displayName = "SimpleTextarea";

export { SimpleTextarea }; 