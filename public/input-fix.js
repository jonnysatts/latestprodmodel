// Script to ensure all inputs are interactive
(function() {
  console.log('[INPUT-FIX] Initializing input fix script');
  
  // Function to make an element interactive
  function makeInteractive(element) {
    if (!element) return;
    
    // Apply critical styles
    element.style.setProperty('pointer-events', 'auto', 'important');
    element.style.setProperty('position', 'relative', 'important');
    element.style.setProperty('z-index', '9999', 'important');
    
    // Add special event handlers
    element.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('[INPUT-FIX] Element clicked:', element);
    }, true);
    
    element.addEventListener('focus', function(e) {
      console.log('[INPUT-FIX] Element focused:', element);
    }, true);
  }
  
  // Function to fix file inputs
  function fixFileInputs() {
    document.querySelectorAll('input[type="file"]').forEach(fileInput => {
      // Make sure the input is visible and interactive
      fileInput.style.setProperty('opacity', '1', 'important');
      fileInput.style.setProperty('display', 'block', 'important');
      fileInput.style.setProperty('visibility', 'visible', 'important');
      makeInteractive(fileInput);
      
      console.log('[INPUT-FIX] File input enhanced:', fileInput);
    });
  }
  
  // Function to find and fix all input fields
  function fixAllInputs() {
    // Target all interactive elements
    const elements = document.querySelectorAll('input, textarea, select, button, [role="button"]');
    
    elements.forEach(element => {
      console.log('[INPUT-FIX] Fixing element:', element);
      makeInteractive(element);
      
      // Special handling for hidden file inputs
      if (element.type === 'file') {
        // Special handling for file inputs
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('display', 'block', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
      }
    });
  }
  
  // Run on DOM content loaded
  window.addEventListener('DOMContentLoaded', function() {
    console.log('[INPUT-FIX] DOM loaded, applying fixes');
    fixAllInputs();
    
    // Set up a mutation observer to watch for new inputs
    const observer = new MutationObserver(function(mutations) {
      console.log('[INPUT-FIX] DOM changed, reapplying fixes');
      fixAllInputs();
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  });
  
  // Focus/click simulation helper
  window.simulateClick = function(selector) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('[INPUT-FIX] Simulating click on', element);
      element.focus();
      element.click();
    }
  };
  
  // Special fix for file inputs
  window.addEventListener('load', function() {
    setTimeout(fixFileInputs, 1000);
    setTimeout(fixFileInputs, 2000);
    setTimeout(fixFileInputs, 5000);
  });
})(); 