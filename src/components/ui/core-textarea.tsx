import * as React from "react";
import { cn } from "../../lib/utils";

// Define comprehensive textarea props interface
export interface CoreTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * CoreTextarea - A reliable base textarea component
 * 
 * This component is intentionally minimal to ensure maximum reliability
 * while still supporting all standard HTML textarea attributes and React features.
 */
const CoreTextarea = React.forwardRef<HTMLTextAreaElement, CoreTextareaProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    
    // Create a local ref to ensure we can access the textarea element
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Combine the forwarded ref with our local ref
    const combinedRef = useCombinedRefs(ref, textareaRef);
    
    React.useEffect(() => {
      if (textareaRef.current) {
        // Force pointer events to ensure the textarea is interactive
        textareaRef.current.style.pointerEvents = "auto";
        
        // Apply styles to make textarea more visible in the stacking context
        textareaRef.current.style.position = "relative";
        textareaRef.current.style.zIndex = "1"; 
      }
    }, []);
    
    return (
      <textarea
        ref={combinedRef}
        className={cn(
          "core-textarea",
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
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

CoreTextarea.displayName = "CoreTextarea";

/**
 * Helper to combine multiple refs
 */
function useCombinedRefs<T>(
  ...refs: Array<React.Ref<T> | null | undefined>
): React.RefCallback<T> {
  return React.useCallback((element: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      
      if (typeof ref === "function") {
        ref(element);
      } else {
        // TypeScript doesn't know that ref is a MutableRefObject here
        (ref as React.MutableRefObject<T>).current = element;
      }
    });
  }, [refs]);
}

export { CoreTextarea }; 