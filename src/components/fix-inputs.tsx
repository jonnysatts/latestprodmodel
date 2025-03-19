import * as React from "react";

/**
 * FixInputs - A wrapper component that ensures all inputs are interactive
 * 
 * This component applies global fixes to make sure all input elements,
 * textareas, and select elements can receive focus and interact properly.
 */
export function FixInputs({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Create a stylesheet to ensure inputs are interactive
    const style = document.createElement('style');
    style.textContent = `
      /* Ensure all inputs have pointer events and proper z-index */
      input, textarea, select, button, [role="button"] {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10 !important;
      }
      
      /* Ensure parent elements don't block clicks */
      form, label, div, span {
        pointer-events: auto !important;
      }
      
      /* Fix any overlay issues */
      div[class*="overlay"], div[class*="Overlay"], div[style*="position: fixed"] {
        pointer-events: none !important;
      }
      
      /* Make sure important interactive elements work */
      button, a, [role="button"] {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 5 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Fix for existing inputs
    function fixInputs() {
      const elements = document.querySelectorAll('input, textarea, select, button, [role="button"]');
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.pointerEvents = 'auto';
          el.style.position = 'relative';
          el.style.zIndex = '10';
          
          // Fix parent elements too
          let parent = el.parentElement;
          while (parent) {
            parent.style.pointerEvents = 'auto';
            parent = parent.parentElement;
          }
        }
      });
    }
    
    // Run initially
    fixInputs();
    
    // Set up a MutationObserver to catch new inputs
    const observer = new MutationObserver(mutations => {
      fixInputs();
    });
    
    // Watch for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Clean up
    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);
  
  return <>{children}</>;
}

export default FixInputs; 