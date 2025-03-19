// Diagnostic tool to identify input interaction issues
(function() {
  const DEBUG = true; // Set to true to enable console logging
  
  function log(...args) {
    if (DEBUG) console.log('[Diagnostic]', ...args);
  }
  
  // Function to check if an element or its ancestors have styles that might block interaction
  function checkBlockingStyles(element) {
    let current = element;
    const issues = [];
    
    while (current && current !== document.body) {
      const styles = window.getComputedStyle(current);
      
      if (styles.pointerEvents === 'none') {
        issues.push({ element: current, issue: 'pointer-events: none' });
      }
      
      if (styles.position === 'relative' || styles.position === 'absolute' || styles.position === 'fixed') {
        if (parseInt(styles.zIndex, 10) < 0) {
          issues.push({ element: current, issue: 'low z-index: ' + styles.zIndex });
        }
      }
      
      if (styles.display === 'none' || styles.visibility === 'hidden') {
        issues.push({ element: current, issue: styles.display === 'none' ? 'display: none' : 'visibility: hidden' });
      }
      
      if (parseFloat(styles.opacity) === 0) {
        issues.push({ element: current, issue: 'opacity: 0' });
      }
      
      current = current.parentElement;
    }
    
    return issues;
  }
  
  // Check for overlapping elements that might block inputs
  function checkOverlappingElements(element) {
    const rect = element.getBoundingClientRect();
    const overlapping = [];
    
    // Get all elements at this position
    const elements = document.elementsFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    
    // Find elements that are above our target element
    let foundTarget = false;
    for (const el of elements) {
      if (el === element) {
        foundTarget = true;
        continue;
      }
      
      if (!foundTarget) {
        const styles = window.getComputedStyle(el);
        if (styles.pointerEvents !== 'none') {
          overlapping.push(el);
        }
      }
    }
    
    return overlapping;
  }
  
  // Add diagnostics to all input fields
  function diagnoseInputs() {
    const inputs = document.querySelectorAll('input, textarea, select, button');
    log(`Found ${inputs.length} input elements`);
    
    inputs.forEach((input, index) => {
      // Check for styling issues
      const stylingIssues = checkBlockingStyles(input);
      if (stylingIssues.length > 0) {
        log(`Input #${index} (${input.id || 'no-id'}) has styling issues:`, stylingIssues);
      }
      
      // Check for overlapping elements
      const overlapping = checkOverlappingElements(input);
      if (overlapping.length > 0) {
        log(`Input #${index} (${input.id || 'no-id'}) is being overlapped by:`, overlapping);
      }
      
      // Add test event listeners
      input.addEventListener('mouseenter', () => {
        log(`Mouse entered input #${index} (${input.id || 'no-id'})`);
      });
      
      input.addEventListener('focus', () => {
        log(`Input #${index} (${input.id || 'no-id'}) received focus`);
      });
      
      // Apply emergency styles directly to make sure the input is interactive
      input.style.setProperty('pointer-events', 'auto', 'important');
      input.style.setProperty('position', 'relative', 'important');
      input.style.setProperty('z-index', '1000', 'important');
    });
  }
  
  // Wait for DOM to be fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    log('DOM loaded, setting up diagnostics');
    diagnoseInputs();
    
    // Re-run diagnostics when DOM changes (for dynamically added inputs)
    const observer = new MutationObserver((mutations) => {
      diagnoseInputs();
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  });
  
  // Check for React event listeners
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    log('React DevTools detected, can analyze React event system');
  }
})(); 